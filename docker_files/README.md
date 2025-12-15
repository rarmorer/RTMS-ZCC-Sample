# ZCC RTMS Zoom App

A production-ready Zoom Contact Center (ZCC) app with Real-Time Media Streams (RTMS) for capturing audio and transcripts from engagements.

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Zoom app credentials
```

### 3. Start Docker Containers

```bash
docker-compose up
```

This starts all services:
- **Backend** (port 3001) - API server with frontend proxy
- **Frontend** (internal) - React dev server
- **RTMS** (internal) - Media stream processor

### 4. Start ngrok

```bash
# In a separate terminal
npm run ngrok
```

Copy your ngrok URL (e.g., `https://abc123.ngrok-free.app`)

### 5. Update .env with ngrok URL

```bash
PUBLIC_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

Restart backend:
```bash
docker-compose restart backend
```

### 6. Configure Zoom Marketplace

Update your Zoom app with these URLs:

- **Home URL**: `https://your-ngrok-url.ngrok-free.app/api/home`
- **OAuth Redirect**: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
- **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`

### 7. Test in Zoom

1. Open Zoom Desktop Client
2. Join a Contact Center engagement
3. Click **Apps** → your app
4. Authorize and start RTMS
5. Check `rtms/data/` for captured audio/transcripts

## Architecture

```
┌─────────────┐
│    Zoom     │ HTTPS
│   Servers   │
└──────┬──────┘
       │
       │ Webhooks, OAuth
       ▼
┌─────────────┐
│   ngrok     │ Tunnel
│  (port      │
│   3001)     │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│     Docker Container Network        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Backend (port 3001)         │  │
│  │  - API endpoints (/api/*)    │  │
│  │  - Proxies to frontend (/)   │  │
│  │  - OAuth & webhooks          │  │
│  └────────┬─────────────────────┘  │
│           │                         │
│  ┌────────▼──────┐  ┌────────────┐ │
│  │  Frontend     │  │   RTMS     │ │
│  │  (port 3000)  │  │  (port     │ │
│  │  React + HMR  │  │   3002)    │ │
│  └───────────────┘  └────────────┘ │
└─────────────────────────────────────┘
```

**Key Points:**
- All external traffic goes through backend on port 3001
- Frontend runs on port 3000 (internal Docker network only)
- Backend proxies non-API requests to frontend
- Single ngrok tunnel to backend handles everything

## Development

### Start Containers

```bash
npm start
# or
docker-compose up
```

### View Logs

```bash
npm run logs              # All services
npm run logs:backend      # Backend only
npm run logs:frontend     # Frontend only
npm run logs:rtms         # RTMS only
```

### Stop Containers

```bash
npm stop
# or
docker-compose down
```

### Rebuild Containers

```bash
npm run rebuild
```

### Hot Reload

All services support hot reload:
- **Frontend**: React HMR - instant updates
- **Backend**: nodemon - auto-restart on file changes
- **RTMS**: nodemon - auto-restart on file changes

Just edit files and save - changes apply automatically!

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Docker containers |
| `npm stop` | Stop Docker containers |
| `npm run logs` | View all logs |
| `npm run ngrok` | Start ngrok tunnel |
| `npm run health` | Check backend health |
| `npm run rebuild` | Clean rebuild |
| `npm run clean` | Remove containers & images |
| `npm run dev:local` | Run without Docker (local) |

## Environment Variables

Required in `.env`:

```bash
# Zoom App Credentials
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_secret_token

# ngrok URL (update after starting ngrok)
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
ZOOM_REDIRECT_URL=https://your-ngrok-url.ngrok-free.app/api/auth/callback

# Session
SESSION_SECRET=random_secret_key
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/home` | GET | Frontend entry point (for Zoom) |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/webhooks/zoom` | POST | Zoom webhook events |
| `/` | ALL | Proxied to frontend |

## Troubleshooting

### ngrok URL changed?

```bash
# Update .env with new URL
# Restart backend
docker-compose restart backend
```

### Frontend not loading?

```bash
# Check proxy is working
curl http://localhost:3001

# Should return HTML
```

### RTMS not capturing?

```bash
# Check logs
npm run logs:rtms

# Verify RTMS is enabled in Zoom Marketplace
```

### Port already in use?

```bash
# Stop containers
npm stop

# Kill any lingering processes
lsof -ti:3001 | xargs kill -9
```

## Production Deployment

For production, build the frontend and serve from backend:

```bash
npm run build
# Deploy with frontend/build served as static files
```

## RTMS (Real-Time Media Streams)

This app captures audio and transcripts from engagements using Zoom's RTMS API.

**Quick check**: After an engagement, audio and transcripts are saved to:
- Audio: `rtms/data/audio/`
- Transcripts: `rtms/data/transcripts/`

See [RTMS_IMPLEMENTATION.md](RTMS_IMPLEMENTATION.md) for complete details on:
- How RTMS connection is established
- Signature generation and authentication
- Audio/transcript capture process
- Debugging and troubleshooting

## Documentation

- [RTMS_IMPLEMENTATION.md](RTMS_IMPLEMENTATION.md) - Complete RTMS implementation guide
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker setup details
- [DOCKER_NGROK_GUIDE.md](DOCKER_NGROK_GUIDE.md) - ngrok configuration
- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Architecture overview
- [ZCC Implementation Docs](README_ZCC.md) - ZCC-specific features

## Requirements

- Docker Desktop
- Node.js 18+ (for local development)
- ngrok account
- Zoom Marketplace app with RTMS enabled

## License

MIT
