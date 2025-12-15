# ✅ Final Setup - Working Like Zoom Sample!

Your app now works exactly like the [Zoom Advanced Sample](https://github.com/zoom/zoomapps-advancedsample-react).

## Quick Start

### 1. Start Docker

```bash
docker-compose up
```

Starts all services:
- Backend on `http://localhost:3001` (only port exposed)
- Frontend (internal, proxied through backend)
- RTMS (internal)

### 2. Start ngrok

```bash
# In separate terminal
npm run ngrok
```

Copy your ngrok URL: `https://abc123.ngrok-free.app`

### 3. Update .env

```bash
PUBLIC_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

### 4. Restart Backend

```bash
docker-compose restart backend
```

### 5. Configure Zoom Marketplace

All URLs use your ngrok domain:

| Setting | URL |
|---------|-----|
| **Home URL** | `https://abc123.ngrok-free.app/api/home` |
| **OAuth Redirect** | `https://abc123.ngrok-free.app/api/auth/callback` |
| **Webhook URL** | `https://abc123.ngrok-free.app/api/webhooks/zoom` |

### 6. Test

**In Browser:**
```bash
http://localhost:3001
# Should show React frontend
```

**Check Health:**
```bash
curl http://localhost:3001/health
# {"status":"ok",...}
```

**Check Home Endpoint:**
```bash
curl -L http://localhost:3001/api/home
# Should return HTML
```

## How It Works

### Request Flow

```
Zoom → ngrok → Backend:3001 → Proxy → Frontend:3000
                    ↓
                API requests (/api/*)
```

### Key Points

✅ **Single Port**: Only backend port 3001 is exposed
✅ **Frontend Proxy**: Backend proxies all non-API requests to frontend
✅ **Security Headers**: Applied by backend to all responses
✅ **Hot Reload**: Works on all services through Docker volumes
✅ **Single Tunnel**: Only need `ngrok http 3001`

### Architecture

```
External Access (Zoom, Browser)
       ↓
   localhost:3001 (Backend)
       ↓
   ┌────────────────┐
   │ Is /api/* ?    │
   └────┬───────┬───┘
        │       │
      Yes      No
        │       │
        ↓       ↓
   Handle   Proxy to
    API     Frontend
            (internal)
```

## Common Issues & Fixes

### Issue: "domain or scheme is not allowed: http://frontend:3000"

**Fixed!** The `/api/home` endpoint now redirects to `/` which is proxied to frontend correctly.

**Solution:** Already applied - backend redirects `/api/home` → `/` → proxy → frontend

### Issue: Module 'http-proxy-middleware' not found

**First time only:** After `docker-compose up`, run:

```bash
docker exec zcc-backend npm install
docker-compose restart backend
```

This is only needed once to install the proxy module in the container.

### Issue: ngrok URL changed

```bash
# Update .env with new URL
# Restart backend
docker-compose restart backend
```

### Issue: Frontend not loading

```bash
# Check containers
docker ps

# Check backend logs
docker logs zcc-backend

# Should see: "All requests to http://localhost:3001 are proxied to frontend"
```

## Development Workflow

### Make Changes

**Frontend**: Edit files in `frontend/src/` → React HMR updates instantly

**Backend**: Edit `backend/server.js` → nodemon restarts automatically

**RTMS**: Edit `rtms/server.js` → nodemon restarts automatically

### View Logs

```bash
npm run logs              # All services
npm run logs:backend      # Backend only
npm run logs:frontend     # Frontend only
npm run logs:rtms         # RTMS only
```

### Stop/Start

```bash
docker-compose down       # Stop
docker-compose up         # Start
npm run rebuild           # Clean rebuild
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose restart backend` | Restart backend |
| `npm run logs` | View all logs |
| `npm run ngrok` | Start ngrok tunnel |
| `npm run health` | Check backend health |
| `npm run rebuild` | Clean rebuild |

## Zoom Marketplace Configuration

### Scopes Required

- `zoomapp:inmeeting`
- `rtms:stream:read`
- Event subscriptions for RTMS

### URLs

All three URLs use your ngrok domain with different paths:

1. **Home URL**: Where Zoom loads your app
   ```
   https://your-ngrok-url.ngrok-free.app/api/home
   ```

2. **OAuth Redirect URL**: Where Zoom sends OAuth responses
   ```
   https://your-ngrok-url.ngrok-free.app/api/auth/callback
   ```

3. **Event Notification Endpoint URL**: Where Zoom sends webhooks
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom
   ```

### Event Subscriptions

Subscribe to these events:
- `meeting.rtms_started`
- `meeting.rtms_stopped`

## Testing

### 1. Test Backend

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend Proxy

```bash
curl http://localhost:3001/
# Should return HTML from React app
```

### 3. Test /api/home Endpoint

```bash
curl -L http://localhost:3001/api/home
# Should return HTML (follows redirect to /)
```

### 4. Test Security Headers

```bash
curl -I http://localhost:3001/api/home | grep -i "security\|content-type\|frame"
# Should show OWASP security headers
```

### 5. Test in Zoom

1. Open Zoom Desktop Client
2. Join a Contact Center engagement
3. Click Apps → Your app
4. Should load from `https://your-ngrok-url/api/home`
5. Test OAuth, RTMS start/stop

## Success Criteria

✅ `docker-compose up` starts all services
✅ `http://localhost:3001` shows React frontend
✅ `http://localhost:3001/health` returns OK
✅ `http://localhost:3001/api/home` redirects to frontend
✅ Security headers present on all responses
✅ Hot reload works on code changes
✅ ngrok tunnel exposes backend correctly
✅ Zoom can load app via ngrok URL

## Next Steps

1. Test OAuth flow in Zoom
2. Test RTMS start/stop
3. Verify audio/transcript capture in `rtms/data/`
4. Customize frontend UI in `frontend/src/App.js`
5. Add backend features in `backend/server.js`

## Production Deployment

For production:

1. Build frontend: `npm run build`
2. Update backend to serve built files
3. Deploy to cloud with SSL
4. Replace ngrok with real domain
5. Update Zoom Marketplace URLs

---

**Documentation:**
- [README.md](README.md) - Main docs
- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Architecture details
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker configuration

Your app is ready! 🎉
