# Docker + ngrok Setup Guide

## The Problem

In Docker development mode:
- Frontend runs on port 3000
- Backend runs on port 3001
- Zoom needs ONE URL to access your app

## Solution: Build Frontend & Use Backend as Entry Point

### Step-by-Step Setup

#### 1. Build the Frontend

```bash
npm run build
```

This creates `frontend/build/` with your React app.

#### 2. Copy Build to Backend Container

We need to get the build into the backend container. Add this to `docker-compose.yml`:

```yaml
backend:
  volumes:
    # ... existing volumes ...
    - ./frontend/build:/app/frontend/build:ro
```

Or manually copy into running container:

```bash
docker cp frontend/build/. zcc-backend:/app/frontend/build/
```

#### 3. Start Docker Services

```bash
npm start
```

#### 4. Start ngrok to Backend

```bash
ngrok http 3001
```

Copy your ngrok URL: `https://abc123.ngrok-free.app`

#### 5. Update .env

```bash
PUBLIC_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback
```

#### 6. Restart Backend

```bash
docker-compose restart backend
```

#### 7. Update Zoom Marketplace

All URLs use your ngrok URL:

- **Home URL**: `https://abc123.ngrok-free.app/api/home`
- **OAuth Redirect**: `https://abc123.ngrok-free.app/api/auth/callback`
- **Webhook URL**: `https://abc123.ngrok-free.app/api/webhooks/zoom`

## The Flow

```
┌─────────────┐
│    Zoom     │
│   Servers   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────┐
│   ngrok     │
│  (tunnel)   │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│     Docker Container (Backend)      │
│                                     │
│  Port 3001                          │
│  ┌──────────────────────────────┐  │
│  │  /api/home                   │  │
│  │  → Serves frontend build     │  │
│  │                               │  │
│  │  /api/auth/callback          │  │
│  │  → OAuth handler             │  │
│  │                               │  │
│  │  /api/webhooks/zoom          │  │
│  │  → Webhook handler           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Alternative: Development Mode (2 Tunnels)

If you want hot reload on frontend without building, you need 2 ngrok tunnels:

### Using ngrok with Multiple Tunnels

Create `ngrok.yml`:

```yaml
tunnels:
  frontend:
    proto: http
    addr: 3000
  backend:
    proto: http
    addr: 3001
```

Start both:

```bash
ngrok start --all --config ngrok.yml
```

You'll get 2 URLs:
- Frontend: `https://abc123.ngrok-free.app` → localhost:3000
- Backend: `https://xyz456.ngrok-free.app` → localhost:3001

**Update .env:**

```bash
PUBLIC_URL=https://xyz456.ngrok-free.app
FRONTEND_URL=https://abc123.ngrok-free.app
REACT_APP_BACKEND_URL=https://xyz456.ngrok-free.app
ZOOM_REDIRECT_URL=https://xyz456.ngrok-free.app/api/auth/callback
```

**Zoom Marketplace:**
- Home URL: `https://abc123.ngrok-free.app`
- OAuth/Webhooks: `https://xyz456.ngrok-free.app/api/...`

**Problem**: Free ngrok only allows 1 tunnel at a time!

## Recommended Workflow

### For Production Testing

```bash
# 1. Build frontend
npm run build

# 2. Copy to backend
docker cp frontend/build/. zcc-backend:/app/frontend/build/

# 3. Start ngrok to backend
ngrok http 3001

# 4. Use ngrok URL in Zoom Marketplace
```

### For Development (Hot Reload)

Use **local development** without Docker:

```bash
# Terminal 1: Local services with hot reload
npm run dev

# Terminal 2: ngrok to backend
ngrok http 3001

# Terminal 3: Build frontend when needed
npm run build
```

This gives you:
- ✅ Hot reload on all services (no Docker needed)
- ✅ Single ngrok tunnel
- ✅ Build frontend when you want to test in Zoom

## Updated docker-compose.yml

Add frontend build volume to backend:

```yaml
backend:
  volumes:
    - ./backend:/app:delegated
    - backend-node-modules:/app/node_modules
    - ./.env:/app/../.env:ro
    - ./frontend/build:/app/frontend/build:ro  # Add this line
```

## Quick Commands

```bash
# Development (no Docker)
npm run dev                    # Start all services locally
ngrok http 3001               # Tunnel to backend

# Docker Production-like
npm run build                 # Build frontend
npm start                     # Start Docker
ngrok http 3001               # Tunnel to backend
docker cp frontend/build/. zcc-backend:/app/frontend/build/
docker-compose restart backend

# Check if build is served
curl http://localhost:3001/api/home
# Should return HTML, not redirect
```

## Why This Matters for Zoom

Zoom Apps require:
1. **OWASP security headers** on all responses
2. **OAuth callback** at a specific URL
3. **Webhooks** at a publicly accessible URL
4. **Home URL** that loads your app with security headers

By serving the frontend through the backend:
- ✅ All requests go through security middleware
- ✅ Single ngrok tunnel needed
- ✅ Proper headers on all responses
- ✅ OAuth and webhooks work correctly

## Troubleshooting

### ngrok URL changed?

Update `.env` and restart:

```bash
# Update PUBLIC_URL and ZOOM_REDIRECT_URL in .env
docker-compose restart backend
```

### Frontend changes not showing?

Rebuild and copy:

```bash
npm run build
docker cp frontend/build/. zcc-backend:/app/frontend/build/
docker-compose restart backend
```

### Want faster iteration?

Use local development:

```bash
npm run dev  # Instead of Docker
ngrok http 3001
```

## Summary

**Best Setup:**
- **Development**: Use `npm run dev` (local, not Docker) + ngrok
- **Testing in Zoom**: Build frontend, copy to backend, use ngrok to backend
- **Production**: Deploy with built frontend served by backend

This gives you the best of both worlds: fast development and proper Zoom integration!
