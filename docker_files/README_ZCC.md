# ZCC RTMS Zoom App

A minimal working **Zoom Contact Center (ZCC)** app that implements Real-Time Media Streams (RTMS) for capturing audio and transcripts from contact center engagements.

## What is Different for ZCC?

This app is specifically designed for **Zoom Contact Center** environments, which differ from regular Zoom meetings:

### Key ZCC Differences

1. **Engagement ID vs Meeting UUID**
   - Uses `engagement_id` instead of `meeting_uuid`
   - Signature: `HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)`

2. **ZCC-Specific SDK APIs**
   - `getEngagementContext()` - Get engagement details
   - `getEngagementStatus()` - Get engagement state and consumer info
   - `getEngagementVariableValue()` - Access custom variables

3. **ZCC-Specific Events**
   - `onEngagementContextChange` - Engagement switches
   - `onEngagementStatusChange` - State changes (active, wrap-up, end)
   - `onEngagementVariableValueChange` - Variable updates

4. **Running Context**
   - Context is `inContactCenter` not `inMeeting`
   - Agent-focused interface
   - Multi-engagement support

5. **Engagement States**
   - `active` - Engagement is ongoing
   - `inactive` - Engagement paused
   - `wrap-up` - Post-engagement work
   - `end` - Engagement completed

## Features

- **OAuth 2.0 Authorization**: Secure in-client PKCE flow for agents
- **ZCC SDK Integration**: Full Contact Center API support
- **Engagement Context**: Display engagement ID, queue, transfer info
- **Engagement Status**: Real-time state monitoring with consumer details
- **RTMS Controls**: Start/stop RTMS during active engagements
- **Real-time Transcripts**: Agent + consumer conversation capture
- **Audio Recording**: Raw audio streams (16kHz PCM)
- **Engagement-Aware**: Supports agents handling multiple engagements
- **Auto-Stop**: RTMS automatically stops when engagement ends

## Architecture

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│                  │       │                  │       │                  │
│  Frontend (ZCC)  │◄─────►│     Backend      │◄─────►│   RTMS Server    │
│ React + ZCC SDK  │       │  (OAuth/Proxy)   │       │ (Engagement-Aware)│
│                  │       │                  │       │                  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
         │                          │                          │
         │                          │                          │
         └──────────────────────────┴──────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │                  │
                         │  Zoom Contact    │
                         │     Center       │
                         │   (Webhooks)     │
                         │                  │
                         └──────────────────┘
```

## Prerequisites

### Required
- Node.js 18+
- Zoom Contact Center account with RTMS enabled
- Zoom Marketplace App (Contact Center type)
- Zoom Desktop Client with Contact Center module

### Optional
- Docker & Docker Compose
- ngrok (for local webhooks)
- ffmpeg (for audio conversion)

## Zoom Marketplace Setup for ZCC

### 1. Create Contact Center Zoom App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Click "Develop" → "Build App"
3. Choose **"Contact Center Apps"** (not regular Zoom Apps!)
4. Fill in basic information

### 2. Configure OAuth

Navigate to **App Credentials**:
- Copy your **Client ID** and **Client Secret**
- Set **OAuth Redirect URL**: `https://your-domain.com/api/auth/callback`

### 3. Configure Scopes

Navigate to **Scopes** and add RTMS scopes:
- `meeting:read:meeting_audio` - For audio streams
- `meeting:read:meeting_transcript` - For transcripts
- (Optional) `meeting:update:participant_rtms_app_status` - For REST API control

**Note**: For ZCC, no additional Contact Center scopes are needed beyond RTMS.

### 4. Configure Event Subscriptions

Navigate to **Features** → **Event Subscriptions**:
1. Enable Event Subscriptions
2. Set Event notification endpoint URL: `https://your-domain.com/api/webhooks/zoom`
3. Subscribe to events:
   - `meeting.rtms_started`
   - `meeting.rtms_stopped`
4. Generate and save your **Secret Token**

### 5. Configure Zoom Apps SDK for ZCC

Navigate to **Features** → **Zoom App SDK**:

**Standard Capabilities:**
- `authorize`
- `onAuthorized`
- `getUserContext`
- `getRunningContext`
- `startRTMS`
- `stopRTMS`

**ZCC-Specific Capabilities:**
- `getEngagementContext`
- `getEngagementStatus`
- `getEngagementVariableValue`
- `onEngagementContextChange`
- `onEngagementStatusChange`
- `onEngagementVariableValueChange`

### 6. No Zoom Client Support Selection Needed

For Contact Center apps, no selection is required in the "Zoom Client Support" section. ZCC apps automatically work on Zoom desktop client.

## Installation

Same as standard installation - follow [QUICK_START.md](QUICK_START.md)

## Usage in Zoom Contact Center

### 1. Access the App

1. Open Zoom Desktop Client with Contact Center module
2. Log in as an **Agent** or **Supervisor**
3. When an engagement comes in, accept it
4. Click "Apps" in the engagement panel
5. Find and open your ZCC RTMS App

### 2. Authorize

1. Click "Authorize App" button
2. Complete OAuth flow
3. Wait for authorization confirmation

### 3. Monitor Engagement

The app displays:
- **Engagement Context**: ID, start time, queue name, transfer info
- **Engagement Status**: State, channel, source, consumer details
- **Agent Info**: Your agent details

### 4. Start RTMS

1. Ensure engagement state is "active"
2. Click "Start RTMS"
3. App captures:
   - Agent voice
   - Consumer voice
   - Real-time transcripts with speaker identification
   - Timestamps

### 5. Stop RTMS

1. Click "Stop RTMS" when done
2. Or wait - RTMS auto-stops when engagement ends
3. Data automatically saved to RTMS server

### 6. Handle Multiple Engagements

The app is **engagement-aware**:
- Tracks multiple engagements independently
- Updates display when agent switches engagements
- Properly manages RTMS for each engagement
- Cleans up when engagements end

## Data Storage

Transcripts and audio are stored with engagement IDs:

```
rtms/data/
├── audio/
│   └── audio_engagement_[id]_[timestamp].raw
└── transcripts/
    └── transcript_engagement_[id]_[timestamp].txt
```

### Transcript Format

```
=== ZCC Engagement Transcript Started at 2025-12-11T13:42:00.000Z ===
Engagement ID: eng_abc123xyz
Stream ID: stream_id_here
======================================================================

[2025-12-11T13:42:21.000Z] Agent Smith: Thank you for calling support
[2025-12-11T13:42:25.000Z] John Doe: Hi I need help with my account
[2025-12-11T13:42:30.000Z] Agent Smith: I'll be happy to help you with that

======================================================================
=== Transcript Ended at 2025-12-11T14:15:00.000Z ===
Total Duration: 1980 seconds
```

## Engagement States

| State | Description | RTMS Available |
|-------|-------------|----------------|
| `active` | Engagement ongoing | ✅ Yes |
| `inactive` | Engagement paused | ❌ No |
| `wrap-up` | Post-engagement work | ❌ No |
| `end` | Engagement completed | ❌ No |

## ZCC-Specific Features

### Engagement Context

```javascript
{
  engagementId: "eng_abc123",
  startTime: "2025-12-11T13:42:00Z",
  acceptTime: "2025-12-11T13:42:05Z",
  queueId: "queue_id",
  queueName: "Support Queue",
  isTransfer: false,
  transferType: null,
  transferFromAgentId: null,
  transferFromAgentName: null
}
```

### Engagement Status

```javascript
{
  engagementId: "eng_abc123",
  state: "active",
  channel: "voice",
  source: "video_webVideo",
  isConference: false,
  assignedAgentId: "agent_123",
  assignedAgentName: "Agent Smith",
  consumers: [
    {
      consumerId: "consumer_456",
      consumerDisplayName: "John Doe",
      consumerNumber: "+1234567890",
      consumerEmail: "john@example.com"
    }
  ],
  endTime: null
}
```

## Differences from Regular Meetings

| Feature | Regular Meetings | ZCC |
|---------|-----------------|-----|
| Identifier | `meeting_uuid` | `engagement_id` |
| Context | `inMeeting` | `inContactCenter` |
| SDK APIs | `getMeetingContext()` | `getEngagementContext()` |
| Events | `onMeetingContextChange` | `onEngagementContextChange` |
| Participants | All equal | Agent + Consumers |
| Signature | Uses meeting_uuid | Uses engagement_id |
| Multi-session | No | Yes (engagement-aware) |

## Troubleshooting ZCC

### App Won't Load in Contact Center

**Problem**: App doesn't appear in Contact Center

**Solution**:
- Ensure you created a "Contact Center App" not regular "Zoom App"
- Check you're logged in as Agent or Supervisor
- Verify app is published or you're added as tester

### No Engagement Context

**Problem**: `getEngagementContext()` returns empty

**Solution**:
- Ensure you're in an active engagement (not just logged into Contact Center)
- Accept an incoming engagement first
- Check that running context is `inContactCenter`

### RTMS Won't Start

**Problem**: startRTMS fails in Contact Center

**Solution**:
- Verify engagement state is "active"
- Check RTMS scopes are approved
- Ensure RTMS is enabled on your ZCC account
- Confirm engagement_id exists

### Multiple Engagement Issues

**Problem**: Data mixing between engagements

**Solution**:
- The app is engagement-aware by design
- Check logs for `[engagement_id]` prefixes
- Verify `activeEngagements` Map is working
- Each engagement has isolated state

### Signature Mismatch

**Problem**: RTMS connection fails with auth error

**Solution**:
- Verify using `engagement_id` not `meeting_uuid` in signature
- Format: `HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)`
- Check Client ID and Secret are correct

## Development Notes

### Testing ZCC Apps

1. Requires actual Contact Center license
2. Need agent credentials
3. Must have incoming engagements (use test consumer)
4. Can't fully test without real engagement flow

### Engagement-Aware State

The RTMS server uses a `Map` to track multiple engagements:

```javascript
activeEngagements.set(engagementId, {
  client, transcriptStream, audioBuffer, // ...
});
```

This allows agents to:
- Handle multiple engagements simultaneously
- Switch between engagements without data loss
- Properly cleanup when engagements end

## API Endpoints

### Backend (Same as regular)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/authorize` | GET | OAuth authorization |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/webhooks/zoom` | POST | Zoom webhook handler |

### RTMS Server (Enhanced for ZCC)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health + active engagements list |
| `/webhook` | POST | ZCC RTMS webhook handler |

## Resources

- [Zoom Contact Center Apps Documentation](https://developers.zoom.us/docs/contact-center/)
- [Zoom RTMS Documentation](https://developers.zoom.us/docs/rtms/)
- [ZCC Apps Guide](docs/zcc-apps.md)
- [ZCC RTMS Credentials Guide](docs/rtms-zcc-guide.md)
- [ZCC Events Reference](docs/zcc-zoomapp-events.md)

## Version

1.0.0 - Initial ZCC RTMS implementation with engagement-aware state management

## License

MIT
