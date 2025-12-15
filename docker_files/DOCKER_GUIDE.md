# Docker Setup with Hot Reload

This guide explains how to run the ZCC RTMS Zoom App using Docker with hot reload enabled for all services.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- ngrok (for tunneling to Zoom)

## Quick Start

### 1. Start Services with Docker

```bash
# Build and start all services with hot reload (recommended)
npm start

# Or directly:
npm run docker:dev
```

This will start:
- **Frontend** on port 3000 with React hot module replacement
- **Backend** on port 3001 with nodemon auto-restart
- **RTMS** on port 3002 with nodemon auto-restart

### 2. Start ngrok (in a separate terminal)

```bash
npm run ngrok
```

Copy your ngrok URL and update the `.env` file with it.

## Docker Commands

### Development (with hot reload)

```bash
# Start all services with logs (Ctrl+C to stop)
npm run docker:dev

# Start in detached mode (background)
npm run docker:up

# Stop services
npm run docker:down

# Restart services
npm run docker:restart
```

### View Logs

```bash
# View all logs
npm run docker:logs

# View specific service logs
npm run docker:logs:frontend
npm run docker:logs:backend
npm run docker:logs:rtms
```

### Building and Rebuilding

```bash
# Build Docker images
npm run docker:build

# Rebuild from scratch (cleans everything first)
npm run docker:rebuild

# Clean all Docker resources
npm run docker:clean
```

## Hot Reload Configuration

### Frontend (React)
- **Technology**: React Hot Module Replacement (HMR)
- **How it works**: Changes to `src/` files are detected and hot-reloaded in browser
- **No page refresh needed**: Component state is preserved
- **Volumes mounted**:
  - `./frontend/src` → `/app/src`
  - `./frontend/public` → `/app/public`

### Backend (Express)
- **Technology**: nodemon
- **How it works**: Server restarts automatically on file changes
- **Watches**: All `.js` files, middleware, routes, and `.env`
- **Volumes mounted**: Entire `./backend` directory

### RTMS Server
- **Technology**: nodemon
- **How it works**: Server restarts automatically on file changes
- **Ignores**: `data/` folder (audio/transcripts) to avoid restarts during recording
- **Volumes mounted**:
  - `./rtms` directory for source code
  - `./rtms/data` for persisted audio/transcript files

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network (zcc-network)             │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │   Frontend   │◄───┤   Backend    │◄───┤  RTMS Server ││
│  │ Container    │    │ Container    │    │ Container    ││
│  │ localhost:   │    │ localhost:   │    │ localhost:   ││
│  │    3000      │    │    3001      │    │    3002      ││
│  │              │    │              │    │              ││
│  │ React HMR    │    │  nodemon     │    │  nodemon     ││
│  │ Hot Reload   │    │ Auto-restart │    │ Auto-restart ││
│  └──────────────┘    └──────────────┘    └──────────────┘│
│         ▲                    ▲                    ▲        │
│         │                    │                    │        │
│    Volume Mount         Volume Mount         Volume Mount │
│         │                    │                    │        │
└─────────┼────────────────────┼────────────────────┼────────┘
          │                    │                    │
     ./frontend/src       ./backend/          ./rtms/
     ./frontend/public                        ./rtms/data
```

## Volume Mounts Explained

### Named Volumes (for node_modules)
These prevent Docker from overwriting container's node_modules with host's:
- `frontend-node-modules:/app/node_modules`
- `backend-node-modules:/app/node_modules`
- `rtms-node-modules:/app/node_modules`

### Bind Mounts (for source code)
These enable hot reload by syncing host files with container:
- `./frontend/src:/app/src:delegated`
- `./backend:/app:delegated`
- `./rtms:/app:delegated`

The `:delegated` flag optimizes performance on macOS.

## Testing Hot Reload

### 1. Start Docker services
```bash
npm run docker:dev
```

### 2. Test Frontend Hot Reload
Edit `frontend/src/App.js`:
```javascript
// Change any text in the UI
<h1>Test Hot Reload!</h1>
```
**Expected**: Browser updates instantly without refresh

### 3. Test Backend Hot Reload
Edit `backend/server.js`:
```javascript
// Add a console.log
console.log('Backend hot reload working!');
```
**Expected**: Backend container restarts, message appears in logs

### 4. Test RTMS Hot Reload
Edit `rtms/server.js`:
```javascript
// Add a console.log
console.log('RTMS hot reload working!');
```
**Expected**: RTMS container restarts, message appears in logs

## Troubleshooting

### Hot Reload Not Working

**Frontend not updating:**
```bash
# Check if CHOKIDAR_USEPOLLING is set
docker exec zcc-frontend env | grep CHOKIDAR

# Restart frontend container
docker-compose restart frontend
```

**Backend/RTMS not restarting:**
```bash
# Check if nodemon is running
docker exec zcc-backend ps aux | grep nodemon

# Check nodemon config
docker exec zcc-backend cat nodemon.json
```

### Port Already in Use

```bash
# Find what's using the port
lsof -ti:3001

# Kill the process
lsof -ti:3001 | xargs kill -9

# Or stop Docker services
npm run docker:down
```

### Volumes Not Mounting

```bash
# Remove all volumes and rebuild
npm run docker:rebuild
```

### Container Won't Start

```bash
# View container logs
docker-compose logs backend

# Check container status
docker ps -a

# Rebuild specific service
docker-compose build backend
docker-compose up backend
```

## Performance Tips

### macOS/Windows Performance
Docker file sync can be slow on macOS/Windows. We use `:delegated` mounts for better performance:
- Host is authoritative, but updates are batched
- Good balance between consistency and performance

### Reduce Build Time
```bash
# Use Docker layer caching
# package.json is copied before source code
# So npm install only runs when dependencies change
```

## Production Deployment

For production, you'd want to:
1. Build optimized images (multi-stage builds)
2. Use production environment variables
3. Remove hot reload (nodemon, HMR)
4. Use proper orchestration (Kubernetes, ECS)

Example production Dockerfile:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

## Comparison: npm vs Docker

### Local Development (npm)
```bash
npm run dev
```
**Pros:**
- Faster startup
- Direct file access
- Easier debugging
- No Docker overhead

**Cons:**
- Requires local Node.js
- Manual dependency management
- Platform-specific issues

### Docker Development
```bash
npm start  # or npm run docker:dev
```
**Pros:**
- Consistent environment
- Isolated dependencies
- Easy to share setup
- Closer to production

**Cons:**
- Slower file sync (macOS/Windows)
- More memory usage
- Additional learning curve

## Best Practices

1. **Use Docker for consistency** across team members
2. **Use local npm** if you need fastest iteration speed
3. **Always use ngrok** for Zoom webhook testing
4. **Monitor Docker logs** during development
5. **Clean up regularly** with `npm run docker:clean`

## Environment Variables

Docker Compose automatically reads from `.env` file:
- No need to rebuild when changing environment variables
- Just restart: `npm run docker:restart`
- Backend and RTMS mount `.env` as read-only

## Data Persistence

### Audio and Transcripts
The `./rtms/data` folder is mounted as a volume:
- Files persist between container restarts
- Located at: `./rtms/data/audio/` and `./rtms/data/transcripts/`

### Database (Future)
If you add a database, use named volumes:
```yaml
volumes:
  postgres-data:
    driver: local
```

## Next Steps

1. Start Docker services: `npm start`
2. Start ngrok: `npm run ngrok`
3. Update Zoom Marketplace with ngrok URLs
4. Make a code change to test hot reload
5. View logs: `npm run docker:logs`

---

**Quick Reference:**

| Command | Description |
|---------|-------------|
| `npm start` | Start Docker with hot reload |
| `npm run docker:down` | Stop Docker services |
| `npm run docker:logs` | View all logs |
| `npm run docker:rebuild` | Clean rebuild |
| `npm run dev` | Start locally (without Docker) |
