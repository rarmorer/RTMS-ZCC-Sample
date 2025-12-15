# Docker Quick Start

Get up and running with Docker in 3 steps:

## 1. Start Docker Services

```bash
npm start
```

This starts all services with hot reload:
- Frontend: http://localhost:3000 (React HMR)
- Backend: http://localhost:3001 (nodemon)
- RTMS: http://localhost:3002 (nodemon)

## 2. Start ngrok (separate terminal)

```bash
npm run ngrok
```

Copy your ngrok URL and update `.env`:
```bash
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
ZOOM_REDIRECT_URL=https://your-ngrok-url.ngrok-free.app/api/auth/callback
```

Restart services to pick up changes:
```bash
npm run docker:restart
```

## 3. Update Zoom Marketplace

- **Home URL**: `https://your-ngrok-url.ngrok-free.app/api/home`
- **OAuth Redirect**: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
- **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`

## Test Hot Reload

### Frontend
Edit `frontend/src/App.js` → Browser updates instantly

### Backend
Edit `backend/server.js` → Server restarts automatically

### RTMS
Edit `rtms/server.js` → Server restarts automatically

## Useful Commands

```bash
# View logs
npm run docker:logs

# View specific service logs
npm run docker:logs:backend

# Stop services
npm run docker:down

# Rebuild from scratch
npm run docker:rebuild

# Local development (without Docker)
npm run dev
```

## Troubleshooting

### Hot reload not working?
```bash
npm run docker:restart
```

### Port already in use?
```bash
npm run docker:down
lsof -ti:3001 | xargs kill -9
```

### Need to rebuild?
```bash
npm run docker:rebuild
```

---

**See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for detailed documentation**
