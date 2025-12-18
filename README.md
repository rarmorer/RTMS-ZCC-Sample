# Zoom RTMS App - Real-Time Media Streams for ZCC & Meetings

A comprehensive Zoom App that captures real-time audio and transcripts from both **Zoom Contact Center (ZCC)** engagements and **Zoom Meetings** using the Zoom RTMS (Real-Time Media Streams) SDK.

## 🎯 Features

- **Dual Context Support**: Works in both Zoom Contact Center and Zoom Meetings
- **Real-Time Audio Capture**: Live audio streaming with OPUS codec at 16kHz
- **Live Transcription**: Real-time speech-to-text with speaker identification
- **Automatic Data Storage**: Audio and transcripts saved automatically per engagement/meeting
- **Docker-Based**: Fully containerized for easy deployment
- **Webhook Integration**: Automatic RTMS connection via Zoom webhooks
- **Production Ready**: Includes ngrok integration for testing and security middleware

## 📁 Project Structure

```
RTMS_ZCC/
├── frontend/          # React frontend (Zoom App UI)
├── backend/           # Express backend (API, webhooks, OAuth)
├── rtms/              # RTMS server (audio/transcript capture)
├── docs/              # Comprehensive documentation
├── docker_files/      # Docker setup guides
├── .env.example       # Environment configuration template
├── docker-compose.yml # Docker orchestration
└── package.json       # Root package with unified scripts
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Node.js 18+ (for local development)
- Zoom App credentials (Client ID, Secret, Token)
- ngrok account (for testing with Zoom)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd RTMS_ZCC
cp .env.example .env
```

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

# Update .env with your ngrok URL
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
  - `meeting.rtms_started`
  - `meeting.rtms_stopped`

## 📖 Documentation

Detailed guides are available in the [docs/](docs/) directory:

- [00-quick-start.md](docs/00-quick-start.md) - Get started in 5 minutes
- [01-architecture-overview.md](docs/01-architecture-overview.md) - System architecture
- [02-sdk-setup.md](docs/02-sdk-setup.md) - Zoom SDK configuration
- [03-frontend-guide.md](docs/03-frontend-guide.md) - Frontend development
- [04-backend-guide.md](docs/04-backend-guide.md) - Backend API reference
- [05-rtms-guide.md](docs/05-rtms-guide.md) - RTMS server implementation
- [07-security-guide.md](docs/07-security-guide.md) - Security best practices

## 🔧 Development

### Local Development (without Docker)

```bash
# Install dependencies for all services
npm install

# Terminal 1: Start frontend
cd frontend && npm start

# Terminal 2: Start backend
cd backend && npm start

# Terminal 3: Start RTMS server
cd rtms && npm start
```

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

## 📊 How It Works

1. **User Opens App**: Frontend loads in Zoom (ZCC or Meeting)
2. **SDK Initialization**: Zoom Apps SDK connects and detects context
3. **Engagement/Meeting Starts**: Zoom automatically sends RTMS webhook
4. **RTMS Connection**: Backend forwards webhook to RTMS server
5. **Audio Capture**: RTMS server joins stream and captures data
6. **Live Processing**: Audio and transcripts processed in real-time
7. **Data Storage**: Everything saved to `rtms/data/` directory
8. **Engagement/Meeting Ends**: RTMS disconnects and finalizes files

## 🗂️ Data Storage

All captured data is stored in `rtms/data/`:

```
rtms/data/
├── audio/
│   ├── audio_zcc_engagement123_2024-01-15.raw
│   └── audio_meeting_meeting456_2024-01-15.raw
└── transcripts/
    ├── transcript_zcc_engagement123_2024-01-15.txt
    └── transcript_meeting_meeting456_2024-01-15.txt
```

## 🔐 Security

- Environment variables for sensitive credentials
- Security headers middleware (helmet, CSP)
- CORS configuration for frontend-backend communication
- Webhook signature verification
- Session management with secure cookies
- `.env` file excluded from git (use `.env.example` as template)

## 🐛 Troubleshooting

### Frontend not loading
- Check if container is running: `docker-compose ps`
- View logs: `docker-compose logs -f frontend`
- Verify port 3000 is not in use

### RTMS not receiving webhooks
- Verify ngrok is running and URL is updated in .env
- Check Zoom Marketplace webhook subscription
- View RTMS logs: `docker-compose logs -f rtms`
- Test endpoint: `POST http://localhost:3001/api/webhooks/test-rtms`

### Audio/Transcripts not captured
- Ensure RTMS is enabled in your Zoom account settings
- Check that engagement/meeting has started (not just scheduled)
- Verify RTMS server connected: Look for "AUDIO IS BEING CAPTURED" in logs

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Review Zoom documentation: https://developers.zoom.us
- Open an issue on GitHub

## 🎉 Acknowledgments

- Built with [@zoom/appssdk](https://www.npmjs.com/package/@zoom/appssdk)
- RTMS implementation using [@zoom/rtms](https://www.npmjs.com/package/@zoom/rtms)
- React frontend with Create React App

---

**Version**: 1.0.0
**Last Updated**: December 2024
**Supports**: Zoom Contact Center & Zoom Meetings
