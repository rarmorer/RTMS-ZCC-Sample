# Quick Start Guide

Get your RTMS ZCC Zoom App running in under 15 minutes.

## Choose Your Workflow

### 🚀 Option 1: Local Development (Fastest)
**Recommended for development** - Hot reload, no Docker overhead

### 🐳 Option 2: Docker Development
**Recommended for production-like testing** - Consistent environment

---

## Local Development Setup

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Zoom Desktop Client 6.5.5+ installed
- [ ] Zoom Marketplace App created with RTMS enabled
- [ ] ngrok installed (for local development)

## Step 1: Get Your Credentials (5 min)

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Navigate to your app → **App Credentials**
3. Copy these values:
   - Client ID
   - Client Secret
   - Generate and copy Secret Token

## Step 2: Install Dependencies (2 min)

```bash
# Install all dependencies at once
npm run install:all
```

## Step 3: Configure Environment (2 min)

```bash
# Copy and edit the .env file
cp .env.example .env

# Edit .env and update:
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_secret_token
```

## Step 4: Start ngrok (1 min)

```bash
# Start ngrok in a new terminal
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Update your .env files with this URL:
# PUBLIC_URL=https://abc123.ngrok-free.app
# ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

## Step 5: Update Zoom Marketplace (2 min)

Go to your Zoom Marketplace app and update:

1. **OAuth Redirect URL**: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
2. **Event notification endpoint**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`

## Step 6: Run the App (2 min)

**LOCAL (Recommended):**
```bash
# Single command starts all services
npm run dev
```

**DOCKER:**
```bash
# Build frontend first
npm run build

# Start Docker services
npm start
```

## Step 7: Test in Zoom

1. Open Zoom Desktop Client
2. Start or join a meeting
3. Click **Apps** → Find your app
4. Click **Authorize App**
5. Click **Start RTMS**
6. Speak in the meeting
7. Click **Stop RTMS**
8. Check `rtms/data/transcripts/` for your transcript!

## Troubleshooting

### Can't see the app in Zoom?
- Ensure you're using Zoom Desktop Client 6.5.5+
- Check that app is published or you're added as a tester

### Authorization fails?
- Verify ngrok URL is correct in Marketplace
- Check backend logs for errors
- Ensure Client ID/Secret are correct

### RTMS not starting?
- Verify RTMS is enabled on your Zoom account
- Check that you're IN a meeting (not just main client)
- Ensure all RTMS scopes are added in Marketplace

### No transcripts captured?
- Speak for at least 5-10 seconds
- Check that Zoom transcription is enabled
- Verify RTMS server logs show connection

## Next Steps

- Review the [full README](README.md)
- Check [docs/](docs/) for detailed guides
- Customize the UI in [frontend/src/App.js](frontend/src/App.js)
- Add features to [backend/server.js](backend/server.js)

## Need Help?

- Check the [Troubleshooting](README.md#troubleshooting) section
- Review [Zoom RTMS docs](https://developers.zoom.us/docs/rtms/)
- Open an issue on GitHub
