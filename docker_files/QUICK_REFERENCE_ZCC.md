# ZCC RTMS Quick Reference

## Essential ZCC Concepts

### Engagement ID
```javascript
// ZCC uses engagement_id (not meeting_uuid)
const engagementId = payload.engagement_id;
```

### Signature for ZCC
```javascript
// Format: HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)
const message = `${clientId},${engagementId},${rtmsStreamId}`;
const signature = createHmac('sha256', clientSecret).update(message).digest('hex');
```

### Running Context
```javascript
// Check for Contact Center context (not 'inMeeting')
if (runningContext === 'inContactCenter') {
  // ZCC features available
}
```

## ZCC SDK APIs

### Get Engagement Context
```javascript
const { engagementContext } = await zoomSdk.getEngagementContext();

// Returns:
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

### Get Engagement Status
```javascript
const { engagementStatus } = await zoomSdk.getEngagementStatus({
  engagementId: engagementId
});

// Returns:
{
  engagementId: "eng_abc123",
  state: "active", // active | inactive | wrap-up | end
  channel: "voice", // voice | video | messaging | email
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
  ]
}
```

### Event Listeners
```javascript
// Engagement context changes (agent switches engagements)
zoomSdk.onEngagementContextChange((event) => {
  const newContext = event.engagementContext;
  console.log('Switched to engagement:', newContext.engagementId);
});

// Engagement status changes (state updates)
zoomSdk.onEngagementStatusChange((event) => {
  const newStatus = event.engagementStatus;
  console.log('Status changed to:', newStatus.state);

  if (newStatus.state === 'end') {
    // Stop RTMS
  }
});
```

## Engagement States

| State | Description | RTMS Allowed |
|-------|-------------|--------------|
| `active` | Customer interaction ongoing | ✅ Yes |
| `inactive` | Engagement paused | ❌ No |
| `wrap-up` | Post-call work | ❌ No |
| `end` | Engagement completed | ❌ No |

## RTMS Control Logic

```javascript
// Only start RTMS if engagement is active
if (engagementStatus?.state === 'active' && engagementContext?.engagementId) {
  await zoomSdk.callZoomApi('startRTMS');
}

// Auto-stop when engagement ends
if (engagementStatus?.state === 'end' && rtmsStatus === 'running') {
  await zoomSdk.callZoomApi('stopRTMS');
}
```

## Engagement-Aware Storage

```javascript
// Track multiple engagements independently
const activeEngagements = new Map();

// Store engagement data
activeEngagements.set(engagementId, {
  client,
  transcriptStream,
  audioBuffer,
  startedAt,
  rtmsStreamId
});

// Retrieve engagement data
const engagementData = activeEngagements.get(engagementId);

// Cleanup engagement
activeEngagements.delete(engagementId);
```

## File Naming Convention

```javascript
// Transcripts
const filename = `transcript_engagement_${engagementId}_${timestamp}.txt`;

// Audio
const filename = `audio_engagement_${engagementId}_${timestamp}.raw`;
```

## Webhook Payload Structure

### RTMS Started (ZCC)
```json
{
  "event": "meeting.rtms_started",
  "payload": {
    "engagement_id": "eng_abc123",  // NOT meeting_uuid!
    "rtms_stream_id": "stream_xyz",
    "server_urls": "wss://rtms.zoom.us"
  }
}
```

### RTMS Stopped (ZCC)
```json
{
  "event": "meeting.rtms_stopped",
  "payload": {
    "engagement_id": "eng_abc123"  // NOT meeting_uuid!
  }
}
```

## SDK Configuration

```javascript
await zoomSdk.config({
  version: '0.16.0',
  capabilities: [
    // Standard
    'authorize',
    'onAuthorized',
    'getUserContext',
    'getRunningContext',
    'startRTMS',
    'stopRTMS',
    // ZCC-Specific (REQUIRED)
    'getEngagementContext',
    'getEngagementStatus',
    'getEngagementVariableValue',
    'onEngagementContextChange',
    'onEngagementStatusChange',
    'onEngagementVariableValueChange'
  ]
});
```

## Marketplace Setup Checklist

- [ ] Create "Contact Center Apps" (not "Zoom Apps")
- [ ] Add RTMS scopes (audio, transcript)
- [ ] Configure webhook URL
- [ ] Add ZCC SDK capabilities
- [ ] No "Zoom Client Support" selection needed
- [ ] Save Secret Token
- [ ] Publish or add testers

## Common Errors & Solutions

### "Context is not inContactCenter"
**Problem**: App loaded outside Contact Center
**Solution**: Open app from Contact Center agent interface during engagement

### "No engagement ID found"
**Problem**: `getEngagementContext()` returns empty
**Solution**: Ensure agent has accepted an active engagement

### "RTMS button disabled"
**Problem**: Start RTMS button is disabled
**Solution**: Check engagement state is "active", not "inactive" or "wrap-up"

### "Signature mismatch"
**Problem**: RTMS connection fails
**Solution**: Use `engagement_id` in signature, not `meeting_uuid`

## Testing Checklist

- [ ] Open app in Contact Center (not regular Zoom)
- [ ] Log in as Agent or Supervisor
- [ ] Accept an incoming engagement
- [ ] Verify engagement context displays
- [ ] Check engagement status shows "active"
- [ ] Verify consumer information appears
- [ ] Authorize app with OAuth
- [ ] Click "Start RTMS" button
- [ ] Check RTMS server logs for engagement_id
- [ ] Speak in engagement
- [ ] Verify transcript file created with engagement_ prefix
- [ ] Click "Stop RTMS" or end engagement
- [ ] Verify audio and transcript files saved

## Quick Debugging

### Check Running Context
```javascript
const context = await zoomSdk.getRunningContext();
console.log('Context:', context.context); // Should be 'inContactCenter'
```

### Check Engagement
```javascript
const { engagementContext } = await zoomSdk.getEngagementContext();
console.log('Engagement ID:', engagementContext?.engagementId);
```

### Check Status
```javascript
const { engagementStatus } = await zoomSdk.getEngagementStatus({
  engagementId: engagementContext.engagementId
});
console.log('State:', engagementStatus.state); // Should be 'active' for RTMS
```

### Monitor RTMS Server
```bash
# Check active engagements
curl http://localhost:3002/health

# Watch logs
tail -f rtms/logs/server.log | grep engagement_
```

## Key Files Reference

| File | Purpose |
|------|---------|
| [frontend/src/App.js](frontend/src/App.js) | ZCC SDK integration |
| [rtms/server.js](rtms/server.js) | Engagement-aware RTMS |
| [README_ZCC.md](README_ZCC.md) | Complete ZCC guide |
| [ZCC_IMPLEMENTATION_SUMMARY.md](ZCC_IMPLEMENTATION_SUMMARY.md) | What changed |
| [docs/zcc-apps.md](docs/zcc-apps.md) | ZCC APIs reference |
| [docs/rtms-zcc-guide.md](docs/rtms-zcc-guide.md) | ZCC signature guide |

## One-Liner Commands

```bash
# Install all dependencies
npm run install:all

# Run all services
npm run dev

# Docker (all services)
docker-compose up --build

# Check RTMS server health
curl http://localhost:3002/health

# View transcripts
ls -lh rtms/data/transcripts/

# View audio files
ls -lh rtms/data/audio/

# Convert audio to WAV
ffmpeg -f s16le -ar 16000 -ac 1 -i audio_engagement_*.raw output.wav
```

## Support Links

- [ZCC Developer Docs](https://developers.zoom.us/docs/contact-center/)
- [RTMS Documentation](https://developers.zoom.us/docs/rtms/)
- [Zoom Apps SDK](https://developers.zoom.us/docs/zoom-apps/)
- [Marketplace](https://marketplace.zoom.us/)

---

**Quick Start**: See [QUICK_START.md](QUICK_START.md) | **Full Guide**: See [README_ZCC.md](README_ZCC.md)
