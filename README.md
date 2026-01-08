
### Prerequisites

- Docker Desktop installed
- Node.js 18+ (for local development)
- Zoom App credentials (Client ID, Secret, Token)
- ngrok account (for testing with Zoom)
### 2. Configure Environment

Edit `.env` and add your Zoom App credentials:

```bash
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_secret_token
```

### 3. Start with Docker

```bash
# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

This starts:
- **Frontend**: http://localhost:3000 (React app)
- **Backend**: http://localhost:3001 (API server)
- **RTMS Server**: http://localhost:8080 (Media capture)

### 4. Setup ngrok for Testing

```bash
# In a separate terminal
ngrok http 3001

# Update .env with your ngrok/Vanity URL
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
ZOOM_REDIRECT_URL=https://your-ngrok-url.ngrok-free.app/api/auth/callback

# Restart Docker services
docker-compose restart
```

### 5. Configure Zoom Marketplace

Update your Zoom App settings:
- **Home URL**: `https://your-ngrok-url.ngrok-free.app/api/home`
- **Redirect URL**: `https://your-ngrok-url.ngrok-free.app/api/auth/callback`
- **Event Notification Endpoint**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`
- **Subscribe to Events**:
  - `contact_center.voice_rtms_started`
  - `contact_center.voice_rtms_stopped`


## 🔧 Development

### Local Development (without Docker)

```bash
# Install dependencies for all services
npm install

docker compose up to run both frontend and backend

### Useful Commands

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f rtms

# Restart a specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build
```

## 🗂️ Data Storage

All captured data is stored in `rtms/data/`:

```
rtms/data/
├── audio/
│   ├── audio_zcc_engagement123_2024-01-15.wav
└── transcripts/
    ├── transcript_zcc_engagement123_2024-01-15.txt
```

## 🔐 Security

- Environment variables for sensitive credentials
- Security headers middleware (helmet, CSP)
- CORS configuration for frontend-backend communication
- Webhook signature verification
- Session management with secure cookies
- `.env` file excluded from git (use `.env.example` as template)

## 📝 Environment Variables

Key environment variables (see [.env.example](.env.example) for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `ZOOM_APP_CLIENT_ID` | Zoom App Client ID | - |
| `ZOOM_APP_CLIENT_SECRET` | Zoom App Secret | - |
| `ZOOM_SECRET_TOKEN` | Webhook verification token | - |
| `PUBLIC_URL` | Public URL (ngrok) | http://localhost:3001 |
| `FRONTEND_URL` | Frontend URL | http://localhost:3000 |
| `RTMS_SERVER_URL` | RTMS server URL | http://localhost:8080 |
| `NODE_ENV` | Environment | development |



**Version**: 1.0.0
**Last Updated**: December 2024
**Supports**: Zoom Contact Center & Zoom Meetings
