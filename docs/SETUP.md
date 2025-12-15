# Setup Guide - Zoom Consent RTMS App

Complete setup instructions for local development.

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)
- **ngrok** ([Download](https://ngrok.com/download))
- **Zoom Desktop Client** ([Download](https://zoom.us/download))

### Accounts Needed
- Zoom Account (free or paid)
- Zoom App Marketplace Developer Account ([Sign up](https://marketplace.zoom.us/))

---

## Step 1: Create Zoom App

### 1.1 Create New App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click **Develop** → **Build App**
3. Choose **Zoom Apps**
4. Fill in basic information:
   - **App Name**: RTMS Consent Manager (or your preferred name)
   - **Short Description**: Consent-based RTMS access demo
   - **Long Description**: Enterprise demonstration of consent management for RTMS
   - **Company Name**: Your organization
5. Click **Create**

### 1.2 Configure App Information

**Information Tab:**
- Upload app icon (optional)
- Add developer contact information

**Features Tab:**

1. **Zoom App SDK**:
   - Enable Zoom App SDK
   - Add the following APIs:
     - `getMeetingContext`
     - `getMeetingUUID`
     - `getMeetingParticipants`
     - `getRunningContext`
     - `getUserContext`
     - `authorize` (for Phase 6)
     - `onAuthorized` (for Phase 6)
     - `onMyUserContextChange`
     - `onParticipantChange`
     - `startRTMS` (requires approval)
     - `stopRTMS` (requires approval)
     - `connect`
     - `postMessage`
     - `onMessage`
     - `onConnect`
     - `showNotification`
     - `sendAppInvitationToAllParticipants`

2. **Domain Allowlist** (CRITICAL):
   - **⚠️ REQUIRED**: Add `appssdk.zoom.us` to the domain allowlist
   - DO NOT include `https://` prefix - just the domain name
   - Without this, the Zoom Apps SDK will not load
   - Go to **Features** → **Zoom App SDK** → **Domain Allowlist**
   - Add: `appssdk.zoom.us`

3. **Scopes (RTMS Media Access)**:
   - Go to **Scopes** page
   - Enable the media formats your app needs:
     - ✅ **Transcripts** (for transcript-based consent demo)
     - ☐ Audio (if you need audio streams)
     - ☐ Video (if you need video streams)
   - These scopes determine what RTMS media types your app can access

4. **Event Subscriptions** (for Phase 3+):
   - Enable Event Subscriptions
   - Add events:
     - `meeting.started`
     - `meeting.ended`
     - `meeting.participant_joined`
     - `meeting.participant_left`
     - `meeting.rtms_started` (Phase 4)
     - `meeting.rtms_stopped` (Phase 4)

### 1.3 Copy Credentials

1. Go to **Basic Information** → **App Credentials**
2. Copy **Client ID** and **Client Secret**
3. Keep these secure - you'll need them for the `.env` file

---

## Step 2: Clone and Configure Project

### 2.1 Clone Repository

```bash
git clone <your-repo-url>
cd rtms-consent-app
```

### 2.2 Create Environment File

```bash
# Copy template
cp .env.local .env

# Open in your editor
code .env  # or vim .env, nano .env, etc.
```

### 2.3 Generate Secrets

```bash
# Generate SESSION_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and paste into .env as SESSION_SECRET

# Generate REDIS_ENCRYPTION_KEY (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Copy output and paste into .env as REDIS_ENCRYPTION_KEY
```

### 2.4 Update .env File

```bash
# Add your Zoom credentials
ZOOM_APP_CLIENT_ID=<paste_client_id>
ZOOM_APP_CLIENT_SECRET=<paste_client_secret>

# Add generated secrets
SESSION_SECRET=<paste_generated_secret>
REDIS_ENCRYPTION_KEY=<paste_generated_key>

# Leave other values as-is for now (we'll update PUBLIC_URL with ngrok)
```

---

## Step 3: Start ngrok

### 3.1 Install ngrok

```bash
# macOS (Homebrew)
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### 3.2 Start ngrok Tunnel

```bash
ngrok http 3000
```

You should see output like:
```
Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123def456.ngrok-free.app`)

### 3.3 Update .env with ngrok URL

```bash
PUBLIC_URL=https://abc123def456.ngrok-free.app
ZOOM_APP_REDIRECT_URI=https://abc123def456.ngrok-free.app/api/zoomapp/auth
```

**Important**: Keep ngrok running! If you restart ngrok, you'll get a new URL and need to update `.env` and Zoom Marketplace.

---

## Step 4: Update Zoom App URLs

Go back to Zoom App Marketplace and update your app:

### 4.1 Update Home URL

1. Go to **Basic Information** → **App URLs**
2. Set **Home URL**: `https://your-ngrok-url.ngrok-free.app/api/zoomapp/home`
3. Click **Save**

### 4.2 Update OAuth Settings

**⚠️ REQUIRED BEFORE INSTALLATION**: You must configure the OAuth Redirect URL before users can install the app.

1. Go to **Basic Information** → **OAuth** section
2. Set **Redirect URL for OAuth**: `https://your-ngrok-url.ngrok-free.app/api/zoomapp/auth`
   - Replace `your-ngrok-url` with your actual ngrok URL
   - This MUST be set before the app can be installed by any user
3. Set **OAuth Allow List**: `https://your-ngrok-url.ngrok-free.app`
4. Click **Save**

**Note**: While full OAuth implementation is in Phase 6, the redirect URL configuration is required for the app to be installable.

### 4.3 Update Webhook URL (Phase 3+)

1. Go to **Features** → **Event Subscriptions**
2. Set **Event notification endpoint URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`
3. Zoom will send a validation request - leave this for Phase 3

---

## Step 5: Start Development Environment

### Option A: Docker Compose (Recommended)

```bash
# Start all services (frontend, backend, redis)
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

**Services started:**
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Redis**: localhost:6379
- **WebSocket**: ws://localhost:3000

### Option B: Local Development (Without Docker)

**Terminal 1 - Redis**:
```bash
# Install Redis
brew install redis  # macOS
# or apt-get install redis-server  # Ubuntu

# Start Redis
redis-server
```

**Terminal 2 - Backend**:
```bash
cd backend
npm install
npm run dev
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm install
npm start
```

---

## Step 6: Test the App

### 6.1 Install App to Your Account

1. Go to Zoom App Marketplace
2. Find your app
3. Click **Install** or **Add**
4. Authorize the app

### 6.2 Test in Zoom Meeting

1. Open Zoom Desktop Client
2. Start a test meeting (you can be the only participant)
3. Click **Apps** button in meeting toolbar
4. Find and open your app

**Expected Behavior:**
- App loads without errors
- You see either Host Dashboard or Guest View
- Console shows SDK initialization logs
- WebSocket connects successfully

### 6.3 Verify Console Output

Open DevTools in Zoom Client (Right-click → Inspect Element):

```javascript
// Expected console logs:
"Initializing Zoom Apps SDK..."
"SDK Configuration Response: {...}"
"Running Context: inMeeting"
"User Context: {status: 'authenticated', role: 'host', ...}"
"Meeting Context: {meetingUUID: '...', role: 'host', ...}"
"Is Host: true"
"WebSocket connected"
```

### 6.4 Verify Backend

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 123.456
}

# Check Redis connection
docker exec -it zoom-consent-redis redis-cli ping
# Expected: PONG
```

---

## Step 7: Verify Phase 1 Completion

Check that all Phase 1 deliverables are working:

### Deliverables Checklist

- [ ] Docker environment runs without errors
- [ ] Frontend loads in Zoom client
- [ ] SDK successfully initialized
- [ ] Host/Guest mode detection works
- [ ] WebSocket connection established
- [ ] Backend API responds to requests
- [ ] Redis connection successful
- [ ] Consent UI components render

### Run Tests

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

---

## Troubleshooting

### App Won't Load in Zoom

**Problem**: Blank screen or error in Zoom client

**Solutions**:
1. Check ngrok is running and URL hasn't changed
2. Verify Home URL in Zoom Marketplace matches ngrok URL
3. Check backend logs: `docker-compose logs backend`
4. Verify `.env` has correct credentials
5. Try reinstalling the app in Zoom Marketplace

### SDK Configuration Error

**Problem**: `SDK configuration failed`

**Solutions**:
1. Check all required APIs are enabled in Zoom Marketplace
2. Verify SDK version in frontend: `version: '0.16.0'`
3. Check browser console for detailed error
4. Ensure app is running in Zoom client (not regular browser)

### WebSocket Connection Failed

**Problem**: WebSocket won't connect

**Solutions**:
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify CORS settings in `backend/src/server.js`
3. Check frontend WebSocket URL in `contexts/WebSocketContext.jsx`
4. Look for errors in browser console
5. Restart Docker services: `docker-compose restart`

### Redis Connection Error

**Problem**: `Failed to connect to Redis`

**Solutions**:
```bash
# Check Redis container status
docker ps | grep redis

# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Test Redis directly
docker exec -it zoom-consent-redis redis-cli ping
```

### Port Already in Use

**Problem**: `EADDRINUSE` error

**Solutions**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port in .env
PORT=3001
```

### ngrok URL Changed

**Problem**: App stopped working after restarting ngrok

**Solutions**:
1. Copy new ngrok URL
2. Update `.env` file with new URL
3. Update Zoom Marketplace → App URLs → Home URL
4. Update Webhook URL (if configured)
5. Restart Docker services: `docker-compose restart`

---

## Next Steps

After successful Phase 1 setup:

1. **Explore the Code**:
   - Review `frontend/src/App.js` - SDK initialization
   - Review `backend/src/server.js` - Server setup
   - Review `frontend/src/contexts/` - Context implementations

2. **Test Consent UI**:
   - Open app as host
   - Open app as guest (in another browser/incognito)
   - Verify both UIs render correctly

3. **Prepare for Phase 2**:
   - Review [ARCHITECTURE.md](../ARCHITECTURE.md) Phase 2 section
   - Understand consent submission flow
   - Plan state management implementation

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Saves to `frontend/src/` trigger automatic reload
- **Backend**: Uses nodemon, saves to `backend/src/` trigger restart

### Debugging

**Frontend:**
```javascript
// Add breakpoints in Chrome DevTools
// Or use console.log debugging
console.log('Debug:', { variable, state });
```

**Backend:**
```javascript
// Add debug logs
console.log('Debug:', { req: req.body, state });

// Or use Node debugger
node --inspect src/server.js
```

### Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean Redis data)
docker-compose down -v

# Rebuild specific service
docker-compose build backend

# View running containers
docker ps

# Enter container shell
docker exec -it zoom-consent-backend sh

# View container logs
docker logs zoom-consent-backend -f
```

---

## Additional Resources

- [Zoom Apps SDK Documentation](https://developers.zoom.us/docs/zoom-apps/)
- [Zoom Apps Getting Started](https://developers.zoom.us/docs/zoom-apps/getting-started/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

**Phase 1 Setup Complete!** 🎉

You now have a fully functional development environment. Proceed to Phase 2 to implement consent submission and state management.
