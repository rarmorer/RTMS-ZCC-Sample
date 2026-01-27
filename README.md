# Zoom Contact Center RTMS Audio Capture App

A simplified Zoom Contact Center application for manually starting and stopping real-time audio capture using Zoom's Real-Time Media Streams (RTMS) API.

## Overview

This application provides a simple interface with Start and Stop RTMS buttons to manually control audio capture from Zoom Contact Center engagements. Audio is saved as WAV files. The app runs as a containerized microservices architecture with three main components:

- **Frontend**: React-based Zoom App SDK interface with Start/Stop buttons
- **Backend**: Express API server handling OAuth and RTMS control
- **RTMS Server**: Real-time media stream processor for audio capture

## Features

- Manual Start/Stop RTMS controls via simple button interface
- Real-time WebSocket connection to Zoom media servers
- WAV file output (16kHz, 16-bit, mono)
- OAuth 2.0 authentication with Zoom
- Webhook event logging in terminal
- Docker containerization for easy deployment
- Graceful engagement cleanup

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Zoom Cloud                              │
│  (Contact Center Engagements + RTMS Media Servers)              │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │                         │
                 │ Webhooks                │ WebSocket Audio Stream
                 │                         │
┌────────────────▼─────────────────────────▼──────────────────────┐
│                       Backend Server                             │
│  - Receives webhooks from Zoom                                   │
│  - Forwards RTMS events to RTMS Server                          │
│  - Handles OAuth authentication                                  │
│  - Proxies frontend requests                                     │
│  Port: 3001                                                      │
└──────────────┬───────────────────────────┬──────────────────────┘
               │                           │
               │ Proxies UI                │ Forwards webhooks
               │                           │
┌──────────────▼────────────┐   ┌─────────▼────────────────────────┐
│     Frontend (React)      │   │      RTMS Server                  │
│  - Zoom App SDK           │   │  - Connects to Zoom media servers │
│  - User interface         │   │  - Captures audio chunks          │
│  - Engagement status      │   │  - Writes WAV files               │
│  Port: 3000               │   │  Port: 8080                       │
└───────────────────────────┘   └──────────┬───────────────────────┘
                                           │
                                           │ Saves audio
                                           │
                                ┌──────────▼──────────┐
                                │   rtms/data/audio/  │
                                │  (WAV file storage) │
                                └─────────────────────┘
```

## Prerequisites

Before setting up the application, ensure you have:

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for containerized deployment)
- Zoom Contact Center account with admin access
- ngrok account (for exposing local server to Zoom webhooks)

## Zoom Marketplace Setup

### 1. Create a New App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Click "Develop" > "Build App"
3. Select "Zoom Apps" as the app type
4. Fill in basic information:
   - App name: Your app name
   - Short description: Audio capture for contact center
   - Long description: Captures real-time audio from Zoom Contact Center engagements

### 2. Configure App Credentials

In the "App Credentials" tab:

1. Note your **Client ID** and **Client Secret**
2. Add these to your `.env` file as:
   - `ZOOM_APP_CLIENT_ID`
   - `ZOOM_APP_CLIENT_SECRET`

### 3. Configure Information

In the "Information" tab:

1. **App Name**: Your application name
2. **Short Description**: Brief description of your app
3. **Long Description**: Detailed description
4. **Developer Contact**: Your contact information

### 4. Configure Features

In the "Features" tab:

**Zoom App SDK:**
- Enable "Zoom App SDK"
- Add capabilities:
  - `authorize`
  - `onAuthorized`
  - `getUserContext`
  - `getRunningContext`
  - `getEngagementContext`
  - `getEngagementStatus`
  - `onEngagementContextChange`
  - `onEngagementStatusChange`

**Embedded Zoom App:**
- Enable "Contact Center" as app location
- Home URL: `https://your-ngrok-url.ngrok-free.app/api/home`
- Redirect URL for OAuth: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`

### 5. Configure Scopes

In the "Scopes" tab, add the following OAuth scopes:

**Required:**
- `zoomapp:incontactcenter` - Required for Contact Center context

**Optional (for enhanced features):**
- `user:read:admin` - Read user information
- `contact_center:read:admin` - Read contact center data

### 6. Configure Event Subscriptions

In the "Event Subscriptions" tab:

1. **Enable Event Subscriptions**: Toggle ON
2. **Event notification endpoint URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`
3. **Add Event Types**:
   - `contact_center.voice_rtms_started` - Triggered when RTMS starts for voice engagement
   - `contact_center.voice_rtms_stopped` - Triggered when RTMS stops for voice engagement
   - `meeting.rtms_started` - (Optional) For regular meetings
   - `meeting.rtms_stopped` - (Optional) For regular meetings
4. **Secret Token**: Copy the generated secret token to your `.env` file as `ZOOM_SECRET_TOKEN`

### 7. Configure RTMS

In the "RTMS" tab:

1. **Enable RTMS**: Toggle ON
2. This allows your app to receive real-time media streams from Zoom

### 8. Activate Your App

1. Go to "Activation" tab
2. For development: Install the app to your account
3. For production: Submit for review and publish

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ZOOM_APP_CLIENT_ID` | Client ID from Zoom Marketplace | `abc123xyz` |
| `ZOOM_APP_CLIENT_SECRET` | Client Secret from Zoom Marketplace | `secret123` |
| `ZOOM_SECRET_TOKEN` | Webhook secret token from Marketplace | `token123` |

### URL Configuration

| Variable | Description | Default | When to Update |
|----------|-------------|---------|----------------|
| `PUBLIC_URL` | Public backend URL (main entry point) | `http://localhost:3001` | Update with ngrok URL |
| `FRONTEND_URL` | OAuth redirect destination (should match PUBLIC_URL) | `http://localhost:3001` | Update with ngrok URL |
| `ZOOM_REDIRECT_URL` | OAuth callback URL | `http://localhost:3001/api/auth/callback` | Update with ngrok URL |
| `FRONTEND_INTERNAL_URL` | Docker internal frontend URL | `http://frontend:3000` | Don't change |
| `RTMS_SERVER_URL` | Docker internal RTMS URL | `http://rtms:8080` | Don't change |

**Important:** In Docker mode, the backend (port 3001) is the only external entry point. It proxies all requests to the frontend container. Both `PUBLIC_URL` and `FRONTEND_URL` should point to the backend URL.

### Port Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Frontend port | `3000` |
| `BACKEND_PORT` | Backend API port | `3001` |
| `RTMS_PORT` | RTMS server port | `3002` |

### Other Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_SECRET` | Express session secret | Random string |

## Installation

### 1. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your Zoom credentials
nano .env
```

### 2. Start with Docker

```bash
# Start all services
npm start

# Or use Docker Compose directly
docker-compose up
```

Docker will automatically install all dependencies and start the services:
- Backend API: http://localhost:3001 (main entry point)
- Frontend: Internal only (proxied through backend)
- RTMS Server: Internal only (receives webhooks from backend)

### 3. Setup ngrok for Webhook Testing

In a new terminal:

```bash
# Start ngrok tunnel
npm run ngrok
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) and update:

1. **In your `.env` file** (update these three variables):
   ```bash
   PUBLIC_URL=https://abc123.ngrok-free.app
   FRONTEND_URL=https://abc123.ngrok-free.app
   ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
   ```

2. **In Zoom Marketplace** (update these URLs):
   - Home URL: `https://abc123.ngrok-free.app`
   - Redirect URL: `https://abc123.ngrok-free.app/api/auth/callback`
   - Event notification URL: `https://abc123.ngrok-free.app/api/webhooks/zoom`

3. **Restart the application** to pick up new environment variables:
   ```bash
   npm restart
   ```

## Usage

### Starting Audio Capture

1. Open the Zoom Contact Center app within an active engagement
2. The app will show:
   - Engagement Status (Active/Inactive)
   - Engagement ID
   - Start RTMS and Stop RTMS buttons
3. Click **Start RTMS** to begin audio capture
4. Monitor the RTMS server logs to see audio chunks being received:
   ```bash
   npm run logs:rtms
   ```
5. Click **Stop RTMS** when you want to stop audio capture
6. Audio files are saved to `rtms/data/audio/` directory

### Viewing Logs

Watch all services:
```bash
npm run logs
```

Watch specific service:
```bash
npm run logs:backend   # See API requests and webhook events
npm run logs:rtms      # See audio capture progress
npm run logs:frontend  # See React app logs
```

## Application Flow

### 1. User Starts RTMS

```
User clicks "Start RTMS" button in the app
         ↓
Frontend sends POST to /api/zoom/rtms/control with { engagementId, action: 'start' }
         ↓
Backend makes API call to Zoom Contact Center
         ↓
Zoom triggers webhook: contact_center.voice_rtms_started
         ↓
Backend receives webhook at /api/webhooks/zoom
         ↓
Webhook event logged in backend terminal
         ↓
RTMS server extracts engagement_id, rtms_stream_id, server_urls
```

### 2. RTMS Connection

```
RTMS server connects to Zoom signaling WebSocket
         ↓
Sends handshake with signature (HMAC-SHA256)
         ↓
Receives media server URL
         ↓
Connects to media WebSocket
         ↓
Sends media handshake (requests audio: 16kHz, mono, L16)
         ↓
Sends CLIENT_READY_ACK
```

### 3. Audio Capture

```
RTMS server receives audio data messages (msg_type: 14)
         ↓
Extracts base64-encoded audio chunks
         ↓
Decodes to PCM audio buffer
         ↓
Writes to WAV file stream
         ↓
WAV file saved at: rtms/data/audio/audio_{engagement_id}_{timestamp}.wav
```

### 4. User Stops RTMS

```
User clicks "Stop RTMS" button in the app
         ↓
Frontend sends POST to /api/zoom/rtms/control with { engagementId, action: 'stop' }
         ↓
Backend makes API call to Zoom Contact Center
         ↓
Zoom triggers webhook: contact_center.voice_rtms_stopped
         ↓
Backend receives webhook and logs event in terminal
         ↓
RTMS server closes WebSocket connections
         ↓
Finalizes WAV file
         ↓
Cleans up engagement resources
         ↓
Audio file ready for processing
```

## Data Storage

### Audio Files

- **Location**: `rtms/data/audio/`
- **Format**: WAV (PCM)
- **Sample Rate**: 16kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono
- **Naming**: `audio_{engagement_id}_{timestamp}.wav`

### File Management

```bash
# Clean all audio files
npm run clean:data

# View audio files
ls -lh rtms/data/audio/

# Play audio file (requires sox/ffplay)
ffplay rtms/data/audio/audio_eng_12345_*.wav
```

## Development

### Local Development (without Docker)

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start RTMS server
cd rtms
npm run dev

# Terminal 3: Start frontend
cd frontend
npm start

# Terminal 4: Start ngrok
npm run ngrok
```

### Docker Development

```bash
# Start all services
npm start

# View logs
npm run logs

# View specific service logs
npm run logs:frontend
npm run logs:backend
npm run logs:rtms

# Rebuild containers
npm run rebuild

# Stop all services
npm stop
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start all services with Docker Compose |
| `npm stop` | Stop all Docker containers |
| `npm restart` | Restart all Docker containers |
| `npm run logs` | View logs from all services |
| `npm run logs:backend` | View backend logs only |
| `npm run logs:frontend` | View frontend logs only |
| `npm run logs:rtms` | View RTMS server logs only |
| `npm run build` | Build Docker images |
| `npm run rebuild` | Rebuild and restart all containers |
| `npm run clean` | Stop containers and remove volumes |
| `npm run clean:all` | Clean containers, volumes, and Docker cache |
| `npm run clean:audio` | Delete all captured audio files |
| `npm run health` | Check backend health endpoint |
| `npm run ngrok` | Start ngrok tunnel on port 3001 |

## API Endpoints

### Backend (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/home` | GET | App home (redirects to frontend) |
| `/api/auth/authorize` | GET | OAuth authorization |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/webhooks/zoom` | POST | Zoom webhook handler |
| `/api/zoom/*` | ALL | Proxy to Zoom API |
| `/*` | ALL | Proxy to frontend |

### RTMS Server (Port 8080)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | RTMS webhook handler |
| `/health` | GET | Health check with active engagements |

## Security Features

- **Webhook Signature Verification**: All webhooks verified using HMAC-SHA256
- **OAuth 2.0**: Secure authorization with Zoom
- **Session Management**: Secure session handling with HttpOnly cookies
- **CORS Protection**: Configured CORS for frontend-backend communication
- **Security Headers**: OWASP-recommended security headers
- **Duplicate Prevention**: 5-second deduplication window for webhooks
- **Environment Isolation**: Sensitive credentials in environment variables

## Troubleshooting

### Issue: Webhooks not received

**Solution:**
1. Check ngrok is running and URL is correct
2. Verify webhook URL in Zoom Marketplace matches ngrok URL
3. Check backend logs: `npm run logs:backend`
4. Test webhook endpoint: `curl https://your-ngrok-url.ngrok-free.app/health`

### Issue: Audio files not created

**Solution:**
1. Check RTMS server logs: `npm run logs:rtms`
2. Verify RTMS is enabled in Zoom Marketplace
3. Check engagement_id and rtms_stream_id in webhook payload
4. Ensure rtms/data/audio/ directory exists

### Issue: OAuth authorization fails

**Solution:**
1. Verify ZOOM_APP_CLIENT_ID and ZOOM_APP_CLIENT_SECRET in .env
2. Check OAuth redirect URL matches Marketplace configuration
3. Ensure ngrok URL is updated in both .env and Marketplace
4. Check backend logs for token exchange errors

### Issue: Docker containers fail to start

**Solution:**
1. Check Docker is running: `docker ps`
2. Rebuild containers: `npm run rebuild`
3. Check logs: `npm run logs`
4. Clean Docker volumes: `npm run clean`

### Issue: Frontend can't connect to backend

**Solution:**
1. Verify REACT_APP_BACKEND_URL in .env
2. Check CORS configuration in backend/server.js
3. Ensure backend is running: `curl http://localhost:3001/health`
4. Check browser console for errors

## Production Deployment

### Before Deploying

1. Update environment variables for production
2. Set `NODE_ENV=production`
3. Use strong `SESSION_SECRET`
4. Configure proper domain instead of ngrok
5. Set up SSL/TLS certificates
6. Configure production database (if needed)
7. Set up monitoring and logging
8. Configure backup for audio files

### Deployment Options

- **Cloud Platforms**: AWS, Google Cloud, Azure
- **Container Orchestration**: Kubernetes, Docker Swarm
- **Serverless**: AWS Lambda (requires modifications)
- **PaaS**: Heroku, Render, Railway

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Email: [Your support email]
- Zoom Developer Forum: https://devforum.zoom.us/

## Acknowledgments

- Zoom Developer Platform
- Zoom Real-Time Media Streams API
- Zoom Contact Center API
