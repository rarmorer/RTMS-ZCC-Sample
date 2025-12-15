# ✅ Setup Complete!

Your ZCC RTMS Zoom App now works exactly like the [Zoom Advanced Sample](https://github.com/zoom/zoomapps-advancedsample-react).

## How It Works

### Architecture

```
┌──────────┐
│   Zoom   │ HTTPS
└────┬─────┘
     │
     ▼
┌──────────┐
│  ngrok   │ Tunnel to localhost:3001
└────┬─────┘
     │
     ▼
┌────────────────────────────────────────┐
│        Docker Containers               │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  Backend (port 3001)            │  │
│  │  • API endpoints (/api/*)       │  │
│  │  • Proxies frontend (/)         │  │
│  │  • OAuth & Webhooks            │  │
│  └──────────┬──────────────────────┘  │
│             │                          │
│    ┌────────▼──────┐  ┌────────────┐  │
│    │  Frontend     │  │   RTMS     │  │
│    │  :3000        │  │   :3002    │  │
│    │  (internal)   │  │  (internal)│  │
│    └───────────────┘  └────────────┘  │
└────────────────────────────────────────┘
```

### Key Features

✅ **Single Entry Point**: All traffic goes through backend on port 3001
✅ **Frontend Proxy**: Backend proxies non-API requests to frontend
✅ **Hot Reload**: All services support hot reload
✅ **Single ngrok Tunnel**: Only need to tunnel port 3001
✅ **Docker Networking**: Frontend/RTMS communicate internally

## Quick Start

### 1. Start Docker

```bash
docker-compose up
```

This starts all three containers with hot reload enabled.

### 2. Start ngrok

```bash
# In a separate terminal
npm run ngrok
```

Copy your ngrok URL (e.g., `https://abc123.ngrok-free.app`)

### 3. Update .env

```bash
PUBLIC_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

### 4. Restart Backend

```bash
docker-compose restart backend
```

### 5. Update Zoom Marketplace

All URLs use your ngrok URL:

- **Home URL**: `https://your-ngrok-url.ngrok-free.app/api/home`
- **OAuth Redirect**: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
- **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`

### 6. Test

Open `http://localhost:3001` in your browser - you should see the React frontend!

## Workflow Comparison

### Before (Complex)

```bash
# Terminal 1: Frontend
cd frontend && npm start

# Terminal 2: Backend
cd backend && npm start

# Terminal 3: RTMS
cd rtms && npm start

# Terminal 4: ngrok
ngrok http 3001

# Issues: Multiple processes, CORS, complex configuration
```

### After (Simple - Like Zoom Sample)

```bash
# Terminal 1: All services
docker-compose up

# Terminal 2: ngrok
npm run ngrok

# That's it! ✨
```

## Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start all services |
| `docker-compose down` | Stop all services |
| `npm run logs` | View all logs |
| `npm run ngrok` | Start ngrok tunnel |
| `npm run rebuild` | Clean rebuild |

## What Changed

### 1. docker-compose.yml

- **Backend**: Only port 3001 exposed externally
- **Frontend**: Internal only (port 3000 not exposed)
- **RTMS**: Internal only (port 3002 not exposed)
- **Networking**: All services on same Docker network

### 2. backend/server.js

- Added `http-proxy-middleware`
- Proxies all non-API requests to frontend
- Single entry point for all traffic

### 3. package.json

Simplified scripts:
- `npm start` → `docker-compose up`
- `npm stop` → `docker-compose down`
- `npm run logs` → View logs
- `npm run ngrok` → Start tunnel

### 4. Frontend Configuration

- `REACT_APP_BACKEND_URL=/api` (relative path)
- No CORS issues (same origin through proxy)
- Hot reload works through WebSocket proxy

## Testing

### Test Backend Health

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```

### Test Frontend Proxy

```bash
curl http://localhost:3001/
# Should return React HTML
```

### Test Hot Reload

**Frontend**: Edit `frontend/src/App.js` → Browser updates instantly

**Backend**: Edit `backend/server.js` → Nodemon restarts automatically

**RTMS**: Edit `rtms/server.js` → Nodemon restarts automatically

## Troubleshooting

### First Time Setup Issue

After first `docker-compose up`, you might need to:

```bash
# Install dependencies in backend container
docker exec zcc-backend npm install

# Restart backend
docker-compose restart backend
```

This installs `http-proxy-middleware` in the container.

### ngrok URL Changed

```bash
# Update .env
# Restart backend
docker-compose restart backend
```

### Port Already in Use

```bash
docker-compose down
lsof -ti:3001 | xargs kill -9
```

### Frontend Not Loading

```bash
# Check containers are running
docker ps

# Check backend logs
docker logs zcc-backend

# Should see: "All requests to http://localhost:3001 are proxied to frontend"
```

## Production Deployment

For production, you'd:

1. Build frontend: `npm run build`
2. Serve build from backend (already configured)
3. Deploy to cloud with proper SSL
4. No ngrok needed in production

## Documentation

- [README.md](README.md) - Main documentation
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker details
- [DOCKER_NGROK_GUIDE.md](DOCKER_NGROK_GUIDE.md) - ngrok configuration

## Success!

Your app now works exactly like the Zoom advanced sample:

✅ `docker-compose up` starts everything
✅ Single ngrok tunnel to port 3001
✅ Backend proxies frontend automatically
✅ Hot reload on all services
✅ Clean, simple workflow

Happy coding! 🎉
