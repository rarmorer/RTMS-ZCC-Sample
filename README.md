# Zoom Contact Center RTMS App

A simple web application for monitoring real-time audio streams from Zoom Contact Center engagements. The app provides live status updates showing when RTMS connections start, how many audio chunks are received, and when they stop.

## What It Does

This app allows you to:
- Start and stop real-time media streaming for Zoom Contact Center engagements
- View live status updates of audio streaming activity
- Monitor audio chunk counts in real-time through a web interface


## Prerequisites

- Docker and Docker Compose installed
- Zoom Contact Center account
- ngrok account (for testing with Zoom webhooks)

## Quick Start

### 1. Clone and Setup Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Zoom credentials
nano .env
```

You'll need these values from Zoom Marketplace (see Zoom Setup section below):
- `ZOOM_APP_CLIENT_ID`
- `ZOOM_APP_CLIENT_SECRET`
- `ZOOM_SECRET_TOKEN`

### 2. Start the Application

```bash
# Start all services with Docker
docker-compose up
```

The app will be available at: http://localhost:3001

### 3. Setup ngrok (for testing with Zoom)

In a new terminal:

```bash
# Start ngrok tunnel
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) and update your `.env` file:

```bash
PUBLIC_URL=https://abc123.ngrok-free.app
FRONTEND_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

Then restart the application:

```bash
docker-compose restart
```

## Zoom Marketplace Setup

### Create a Zoom App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Click **Develop** > **Build App**
3. Select **Zoom Apps** as the app type
4. Fill in basic information

### Configure the App

**App Credentials Tab:**
- Copy your Client ID, Client Secret, and add to `.env`

**Features Tab -> Surface:**
- Enable **Zoom App SDK** with these capabilities:
  - `getEngagementContext`
  - `getEngagementStatus`
- Enable **Contact Center** as app location
- Set **Home URL**: `https://your-ngrok-url.ngrok-free.app`

**Scopes Tab:**
- Add: `zoomapp:incontactcenter`

**Event Subscriptions Tab:**
- Enable Event Subscriptions
- Set **Event notification endpoint URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`
- Add these event types:
  - `contact_center.engagement_started` ⚠️ **Required** - Enables Start/Stop buttons
  - `contact_center.engagement_ended` ⚠️ **Required** - Disables buttons when engagement ends
  - `contact_center.voice_rtms_started` - Shows RTMS start status
  - `contact_center.voice_rtms_stopped` - Shows RTMS stop status
- Copy the Secret Token to your `.env` as `ZOOM_SECRET_TOKEN`

**RTMS Tab:**
- Enable RTMS

**Activation Tab:**
- Install the app to your account

### OAuth Authentication & Token Storage

The app uses OAuth 2.0 for authentication with automatic token refresh:

#### How It Works

1. **Initial Authentication**
   - Install the app from Zoom Marketplace
   - The OAuth flow opens in a new window/tab
   - After authorizing, tokens are stored server-side in global storage
   - You'll be redirected back to the app

2. **Why Global Token Storage?**
   - Zoom Apps run inside an iframe within the Zoom client
   - Modern browsers block third-party cookies in iframes for security
   - Session cookies don't work in this environment
   - **Solution**: Tokens are stored in Redis on the server
   - All API requests from the iframe use these Redis-stored tokens

3. **Token Storage Architecture**
   ```
   OAuth Callback → Redis (key: "oauth:tokens")
                         ↓
   Zoom App (iframe) → API Request → Get Tokens from Redis
   ```

4. **Automatic Token Refresh**
   - When an access token expires (401 error), the app automatically:
     - Uses the refresh token to get a new access token
     - Updates Redis with new tokens
     - Retries the failed request seamlessly
   - No user interaction needed!

5. **Benefits of Redis Storage**
   - ✅ Tokens persist across server restarts
   - ✅ Works with Docker container restarts
   - ✅ No need to re-authenticate after deployments
   - ✅ Can scale to multiple backend instances (with proper key strategy)

6. **Production Considerations**
   - Current implementation: Redis storage with key `"oauth:tokens"` (single user)
   - For multi-user production: Update Redis key to include user/account ID (e.g., `oauth:tokens:{userId}`)
   - Token store module location: `backend/helpers/token-store.js`
   - Redis persistence: Uses AOF (Append Only File) for data durability

7. **Re-authentication**
   - If refresh token expires, you'll see "Not authenticated" error
   - Simply reinstall/reauthorize the app from Zoom Marketplace

See [Zoom OAuth documentation](https://developers.zoom.us/docs/integrations/oauth/#app-type-general) for more details.

## Usage

1. Open the app within a Zoom Contact Center engagement
2. Click **Start RTMS** to begin streaming
3. Watch the live status updates showing audio chunks received
4. Click **Stop RTMS** when done

Status messages appear in the terminal-style display:
- 🔵 Starting RTMS connection
- 🟢 Received 50 audio chunks
- 🟢 Received 100 audio chunks
- 🟢 RTMS stopped


## Troubleshooting

**Webhooks not working?**
- Ensure ngrok is running
- Verify ngrok URL is set in both `.env` and Zoom Marketplace
- Check webhook URL matches: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`

**Buttons are greyed out / Can't start RTMS?**
- Make sure you've subscribed to `contact_center.engagement_started` and `contact_center.engagement_ended` webhooks in Zoom Marketplace
- Start an engagement in Zoom Contact Center
- Check backend logs for "Engagement started" message: `docker-compose logs -f backend`
- Verify the webhook is received: Look for `[Engagement Started]` in backend logs
- Check active engagement API: `curl http://localhost:3001/api/engagement/active`
- If webhook received but buttons still greyed: Check browser console for errors

**Can't start RTMS after buttons enabled?**
- Ensure you're authenticated with Zoom (check for "Connect to Zoom" button)
- View backend logs: `docker-compose logs -f backend`
- Check for "Authentication expired" errors - if present, re-authenticate

**Status messages not appearing?**
- Check RTMS server logs: `docker-compose logs -f rtms`
- Verify `BACKEND_URL` is set correctly in `.env`
- Ensure all three services are running: `docker-compose ps`


## License

MIT License
