# RTMS Implementation Guide

This document explains how Real-Time Media Streams (RTMS) is implemented in this ZCC Zoom App.

## Overview

RTMS allows your app to receive real-time audio streams and transcripts from Zoom Contact Center engagements. The implementation follows the official Zoom RTMS documentation and uses the `@zoom/rtms` SDK.

## Architecture

```
┌─────────────┐
│    Zoom     │
│   Servers   │
└──────┬──────┘
       │ Webhook: meeting.rtms_started
       ▼
┌─────────────┐
│   ngrok     │
│  (tunnel)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ Forwards RTMS events
│  (port 3001)│ to RTMS server
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ RTMS Server │ Connects to Zoom
│  (port 3002)│ via WebSocket
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Audio +   │ Saved to:
│ Transcripts │ rtms/data/
└─────────────┘
```

## How It Works

### 1. Webhook Event

When an engagement starts with RTMS enabled, Zoom sends a `meeting.rtms_started` webhook to your app:

```json
{
  "event": "meeting.rtms_started",
  "payload": {
    "engagement_id": "abc123",
    "rtms_stream_id": "xyz789",
    "server_urls": "wss://rtms.zoom.us",
    "meeting_uuid": "meeting-uuid"
  }
}
```

### 2. Backend Forwards to RTMS Server

The backend ([backend/server.js:177-187](backend/server.js#L177-L187)) automatically forwards RTMS events:

```javascript
if (event === 'meeting.rtms_started' || event === 'meeting.rtms_stopped') {
  await axios.post(`${rtmsServerUrl}/webhook`, req.body);
}
```

### 3. RTMS Server Establishes Connection

The RTMS server ([rtms/server.js:83-207](rtms/server.js#L83-L207)) handles the connection:

#### Step 1: Generate Signature

```javascript
function generateZCCSignature(clientId, engagementId, rtmsStreamId, clientSecret) {
  const message = `${clientId},${engagementId},${rtmsStreamId}`;
  return createHmac('sha256', clientSecret).update(message).digest('hex');
}
```

#### Step 2: Configure Audio Parameters

```javascript
client.setAudioParams({
  contentType: rtms.AudioContentType.RAW_AUDIO,
  codec: rtms.AudioCodec.OPUS,
  sampleRate: rtms.AudioSampleRate.SR_16K,
  channel: rtms.AudioChannel.STEREO,
  dataOpt: rtms.AudioDataOption.AUDIO_MIXED_STREAM,
  duration: 20,
  frameSize: 640
});
```

#### Step 3: Set Up Event Handlers

```javascript
// Audio data handler
client.onAudioData((data, timestamp, metadata) => {
  console.log(`Audio data received: ${data.length} bytes`);
  audioBuffer.push(data);
});

// Transcript data handler
client.onTranscriptData((data, timestamp, metadata, user) => {
  const text = data.toString('utf-8');
  const userName = user?.userName || 'Unknown';
  transcriptStream.write(`[${timestamp}] ${userName}: ${text}\n`);
});

// Connection lifecycle handlers
client.onConnect(() => {
  console.log('RTMS connection established');
});

client.onDisconnect((reason) => {
  console.log('RTMS disconnected:', reason);
});

client.onError((error) => {
  console.error('RTMS error:', error);
});
```

#### Step 4: Join the RTMS Stream

```javascript
const signature = generateZCCSignature(
  clientId,
  engagementId,
  rtmsStreamId,
  clientSecret
);

await client.join({
  ...payload,
  signature: signature,
  client_id: clientId
});
```

### 4. Data Capture

As the engagement progresses, the RTMS server:

- **Captures audio**: Raw OPUS audio data buffered in memory
- **Captures transcripts**: Real-time transcription saved to file
- **Tracks engagement**: Each engagement tracked separately

### 5. Cleanup

When the engagement ends or `meeting.rtms_stopped` is received:

1. Transcript file is finalized
2. Audio buffer is written to `.raw` file
3. Client disconnects from RTMS stream
4. Engagement removed from active tracking

## File Structure

```
rtms/
├── server.js           # Main RTMS server
├── data/               # Captured data directory
│   ├── audio/          # Audio files (.raw format)
│   └── transcripts/    # Transcript files (.txt)
├── package.json
└── Dockerfile
```

## Data Files

### Transcript Files

Location: `rtms/data/transcripts/`

Format: `transcript_engagement_{engagement_id}_{timestamp}.txt`

Example content:
```
=== ZCC Engagement Transcript Started at 2025-12-11T10:30:00.000Z ===
Engagement ID: abc123
Stream ID: xyz789
======================================================================

[2025-12-11T10:30:15.123Z] Agent: Hello, how can I help you?
[2025-12-11T10:30:20.456Z] Customer: I need help with my account
[2025-12-11T10:30:25.789Z] Agent: I'd be happy to assist you

======================================================================
=== Transcript Ended at 2025-12-11T10:35:00.000Z ===
Total Duration: 300 seconds
```

### Audio Files

Location: `rtms/data/audio/`

Format: `audio_engagement_{engagement_id}_{timestamp}.raw`

File format: Raw OPUS audio (16kHz, stereo)

To convert to WAV:
```bash
cd rtms/data/audio
ffmpeg -f s16le -ar 16000 -ac 1 -i audio_engagement_abc123_2025-12-11.raw output.wav
```

## Environment Variables

Required in `.env`:

```bash
# Zoom App Credentials
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_secret_token

# RTMS Server (internal Docker network)
RTMS_SERVER_URL=http://rtms:3002
RTMS_PORT=3002
```

## Testing RTMS

### 1. Start the App

```bash
docker-compose up
```

### 2. Start ngrok

```bash
npm run ngrok
```

### 3. Configure Zoom Marketplace

Update your Zoom app with:
- **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/zoom`
- **Enable RTMS**: In Zoom Marketplace, enable "Real-Time Media Streams"

### 4. Test in Zoom

1. Open Zoom Contact Center
2. Start an engagement
3. Enable your app in the engagement
4. Speak during the engagement
5. Check logs:
   ```bash
   npm run logs:rtms
   ```

### 5. Verify Data Capture

After the engagement:
```bash
# Check transcripts
ls -lh rtms/data/transcripts/

# Check audio files
ls -lh rtms/data/audio/

# View latest transcript
cat rtms/data/transcripts/transcript_engagement_*.txt
```

## Debugging

### View RTMS Logs

```bash
# All logs
npm run logs

# RTMS only
npm run logs:rtms
```

### Check RTMS Health

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "ok",
  "activeEngagements": 1,
  "engagements": ["abc123"],
  "timestamp": "2025-12-11T10:30:00.000Z"
}
```

### Common Issues

#### No webhook received

**Symptoms**: No logs in RTMS server

**Solutions**:
1. Verify ngrok is running: `npm run ngrok`
2. Check webhook URL in Zoom Marketplace
3. Verify backend is forwarding events:
   ```bash
   npm run logs:backend | grep rtms
   ```

#### Connection fails

**Symptoms**: "Failed to join RTMS stream" error

**Solutions**:
1. Verify credentials in `.env`:
   ```bash
   echo $ZOOM_APP_CLIENT_ID
   echo $ZOOM_APP_CLIENT_SECRET
   ```
2. Check signature generation in logs
3. Verify RTMS is enabled in Zoom Marketplace

#### No audio/transcript data

**Symptoms**: Connection successful but no data captured

**Solutions**:
1. Verify engagement has active speakers
2. Check if transcription is enabled in engagement
3. Verify audio parameters are correct
4. Check event handlers are registered before `client.join()`

## API Reference

### RTMS Server Endpoints

#### GET /health

Health check and active engagements status

**Response**:
```json
{
  "status": "ok",
  "activeEngagements": 2,
  "engagements": ["engagement1", "engagement2"],
  "timestamp": "2025-12-11T10:30:00.000Z"
}
```

#### POST /webhook

Receives Zoom RTMS webhooks (called by backend)

**Request Body**:
```json
{
  "event": "meeting.rtms_started",
  "payload": {
    "engagement_id": "abc123",
    "rtms_stream_id": "xyz789",
    "server_urls": "wss://rtms.zoom.us"
  }
}
```

**Response**:
```json
{
  "received": true,
  "status": "started"
}
```

## Engagement-Aware Architecture

This implementation tracks multiple concurrent engagements:

```javascript
const activeEngagements = new Map();

activeEngagements.set(engagementId, {
  client,              // RTMS client instance
  transcriptStream,    // File write stream
  transcriptPath,      // File path
  audioBuffer,         // Audio data buffer
  timestamp,           // Start timestamp
  rtmsStreamId,        // Stream ID
  startedAt           // ISO timestamp
});
```

Benefits:
- Handle multiple engagements simultaneously
- Clean separation of data per engagement
- Automatic cleanup on disconnect
- Easy monitoring of active engagements

## Production Considerations

### Security

1. **Validate webhook signatures**: Add Zoom webhook signature validation
2. **Secure credentials**: Use secrets manager for production
3. **Limit data retention**: Implement automatic cleanup of old files

### Scalability

1. **Stream to storage**: Instead of buffering audio in memory, stream directly to cloud storage
2. **Queue processing**: Use message queue for webhook processing
3. **Distributed RTMS**: Multiple RTMS servers behind load balancer

### Monitoring

1. **Add metrics**: Track engagement count, data volume, errors
2. **Add alerting**: Alert on connection failures
3. **Add logging**: Centralized logging (e.g., CloudWatch, DataDog)

## References

- [Zoom RTMS Documentation](https://developers.zoom.us/docs/rtms/work-with-streams/)
- [@zoom/rtms npm package](https://www.npmjs.com/package/@zoom/rtms)
- [RTMS Quickstart](https://github.com/zoom/rtms-quickstart-js)
- [RTMS GitHub Repository](https://github.com/zoom/rtms)

## Next Steps

1. Test with real engagements
2. Implement webhook signature validation
3. Add audio processing (e.g., convert to WAV automatically)
4. Add transcript search/indexing
5. Implement data retention policies
6. Add monitoring and alerting

---

**Implementation completed**: 2025-12-11

Based on official Zoom RTMS documentation and the `@zoom/rtms` SDK.
