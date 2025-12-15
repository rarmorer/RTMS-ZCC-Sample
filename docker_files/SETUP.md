# Setup Guide - ZCC RTMS Zoom App

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies for frontend, backend, and RTMS
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the unified .env template
cp .env.example .env

# Edit .env with your Zoom credentials
nano .env  # or use your preferred editor
```

**Required values to update in `.env`:**
- `ZOOM_APP_CLIENT_ID` - From Zoom Marketplace
- `ZOOM_APP_CLIENT_SECRET` - From Zoom Marketplace
- `ZOOM_SECRET_TOKEN` - From Zoom Marketplace (webhook secret)

### 3. Start All Services

```bash
# Start frontend, backend, and RTMS together
npm run dev

# Or use the alias
npm start
```

That's it! All three services will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **RTMS Server**: http://localhost:3002

## Single .env File

All services now use **one unified `.env` file** at the project root:

```
RTMS_ZCC/
├── .env              ← Single config file (create from .env.example)
├── .env.example      ← Template with all options
├── frontend/         ← No separate .env needed
├── backend/          ← No separate .env needed
└── rtms/             ← No separate .env needed
```

### How It Works

- **Backend** reads: `../env` (relative path from backend/)
- **RTMS** reads: `../.env` (relative path from rtms/)
- **Frontend** uses: `REACT_APP_*` variables from root .env

## Available npm Scripts

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for all services |
| `npm run dev` | Start all services together |
| `npm start` | Alias for `npm run dev` |

### Additional Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build frontend for production |
| `npm run health` | Check if backend and RTMS are running |
| `npm run clean` | Remove all node_modules |
| `npm run clean:data` | Clear captured audio/transcripts |
| `npm run ngrok` | Start ngrok tunnel for backend |

### Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start all services in Docker |
| `npm run docker:down` | Stop Docker services |
| `npm run docker:logs` | View Docker logs |
| `npm run docker:clean` | Clean Docker volumes |

## Development Workflow

### First Time Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd RTMS_ZCC

# 2. Install dependencies
npm run install:all

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start development
npm run dev
```

### Daily Development

```bash
# Start all services
npm run dev

# In another terminal, start ngrok
npm run ngrok

# Update .env with ngrok URL
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
ZOOM_REDIRECT_URL=https://your-ngrok-url.ngrok-free.app/api/auth/callback
```

### Check Health

```bash
# Verify all services are running
npm run health

# Should return:
# Backend: {"status":"ok",...}
# RTMS: {"status":"ok","activeEngagements":0,...}
```

## Environment Variables Reference

All in one file (`.env`):

```bash
# Zoom Credentials (Required)
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_secret
ZOOM_SECRET_TOKEN=your_webhook_token

# Ports (Optional - defaults shown)
PORT=3000                    # Frontend
BACKEND_PORT=3001           # Backend API
RTMS_PORT=3002              # RTMS Server

# URLs (Update for production/ngrok)
PUBLIC_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
RTMS_SERVER_URL=http://localhost:3002
ZOOM_REDIRECT_URL=http://localhost:3001/api/auth/callback

# Frontend (React requires REACT_APP_ prefix)
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_ZOOM_CLIENT_ID=your_client_id

# Session (Generate random string)
SESSION_SECRET=your_random_secret
```

## Troubleshooting

### Services won't start

```bash
# Check if ports are available
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :3002  # RTMS

# Kill processes if needed
kill -9 <PID>
```

### Environment not loading

```bash
# Verify .env exists in root
ls -la .env

# Check .env has correct values (no quotes needed)
cat .env | grep ZOOM_APP_CLIENT_ID
```

### Can't find concurrently

```bash
# Install root dependencies
npm install

# Concurrently should be in devDependencies
```

### Frontend can't reach backend

```bash
# Check REACT_APP_BACKEND_URL in .env
grep REACT_APP_BACKEND_URL .env

# Should be: REACT_APP_BACKEND_URL=http://localhost:3001

# Restart frontend after changing .env
npm run dev
```

## Production Deployment

### Update .env for production

```bash
NODE_ENV=production
PUBLIC_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
ZOOM_REDIRECT_URL=https://your-domain.com/api/auth/callback
REACT_APP_BACKEND_URL=https://your-domain.com
```

### Build frontend

```bash
npm run build
```

### Run with Docker

```bash
npm run docker:up
```

## Useful Tips

### View Logs

```bash
# All services together (with concurrently)
npm run dev

# Individual services
cd backend && node server.js
cd rtms && node server.js
cd frontend && npm start
```

### Test Webhooks Locally

```bash
# Start ngrok
npm run ngrok

# Copy HTTPS URL
https://abc123.ngrok-free.app

# Update .env
PUBLIC_URL=https://abc123.ngrok-free.app
ZOOM_REDIRECT_URL=https://abc123.ngrok-free.app/api/auth/callback

# Update Zoom Marketplace
# - OAuth Redirect: https://abc123.ngrok-free.app/api/auth/callback
# - Webhook URL: https://abc123.ngrok-free.app/api/webhooks/zoom

# Restart services
npm run dev
```

### Clear Data

```bash
# Remove all captured transcripts and audio
npm run clean:data

# Remove all node_modules
npm run clean

# Then reinstall
npm run install:all
```

## Next Steps

1. ✅ Setup complete
2. Configure Zoom Marketplace (see [README_ZCC.md](README_ZCC.md))
3. Test in Zoom Contact Center
4. Review [QUICK_REFERENCE_ZCC.md](QUICK_REFERENCE_ZCC.md)

## Support

- **Setup Issues**: Check this guide
- **ZCC Specifics**: See [README_ZCC.md](README_ZCC.md)
- **API Reference**: See [QUICK_REFERENCE_ZCC.md](QUICK_REFERENCE_ZCC.md)
- **Troubleshooting**: See [ZCC_IMPLEMENTATION_SUMMARY.md](ZCC_IMPLEMENTATION_SUMMARY.md)
