# Complete RTMS Flow - Frontend to Backend

You were absolutely right to question this! Here's the **complete end-to-end flow**:

## The Correct Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "START RTMS" IN FRONTEND                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (App.js:196)                                        │
│    await zoomSdk.startRTMS()                                    │
│    - Tells Zoom to start RTMS for this engagement              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ZOOM SERVERS                                                 │
│    - Initiate RTMS for the engagement                           │
│    - Generate rtms_stream_id                                    │
│    - Prepare WebSocket servers                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ZOOM SENDS WEBHOOK: meeting.rtms_started                    │
│    POST https://your-ngrok-url/api/webhooks/zoom                │
│    {                                                             │
│      "event": "meeting.rtms_started",                           │
│      "payload": {                                                │
│        "engagement_id": "abc123",                               │
│        "rtms_stream_id": "xyz789",                              │
│        "server_urls": "wss://rtms.zoom.us"                      │
│      }                                                           │
│    }                                                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND (backend/server.js:177)                             │
│    - Receives webhook                                            │
│    - Forwards to RTMS server:                                   │
│      POST http://rtms:3002/webhook                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. RTMS SERVER (rtms/server.js:83-207)                         │
│    - Receives webhook                                            │
│    - Creates new rtms.Client()                                  │
│    - Configures audio parameters                                │
│    - Generates HMAC-SHA256 signature                            │
│    - Calls client.join(payload + signature)                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RTMS CLIENT CONNECTS TO ZOOM                                │
│    WebSocket: wss://rtms.zoom.us                                │
│    - Authenticates with signature                               │
│    - Establishes signaling channel                              │
│    - Establishes media channel                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. DATA FLOWS                                                   │
│    Zoom → RTMS Server:                                          │
│    - Audio data (OPUS, 16kHz, stereo)                          │
│    - Transcript data (UTF-8 text with timestamps)               │
│    - Keep-alive messages (every 10 seconds)                     │
│                                                                  │
│    RTMS Server → Disk:                                          │
│    - Buffers audio in memory                                    │
│    - Writes transcripts to file in real-time                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. USER CLICKS "STOP RTMS" (or engagement ends)                │
│    Frontend: await zoomSdk.stopRTMS()                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ZOOM SENDS WEBHOOK: meeting.rtms_stopped                   │
│     Backend forwards to RTMS server                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. RTMS SERVER CLEANUP                                         │
│     - Saves audio buffer to .raw file                           │
│     - Finalizes transcript file                                 │
│     - Calls client.leave()                                      │
│     - Removes from activeEngagements                            │
└─────────────────────────────────────────────────────────────────┘
```

## What I Fixed

### Frontend Issue (FIXED)
```javascript
// ❌ BEFORE - Wrong API call
await zoomSdk.callZoomApi('startRTMS');

// ✅ AFTER - Correct API call
await zoomSdk.startRTMS();
```

The frontend was using `callZoomApi()` which is for generic API calls, instead of the dedicated `startRTMS()` method.

### Backend (Already Correct!)
The backend implementation I created is **correct** - it receives the webhook from Zoom and uses `new rtms.Client()` to connect to the stream.

## Two Components Working Together

### Frontend Role (Zoom Apps SDK - `@zoom/appssdk`)
- Lives inside the Zoom client
- User clicks "Start RTMS" button
- Calls `zoomSdk.startRTMS()` to tell Zoom to initiate RTMS
- This is just a **trigger** - it doesn't handle the actual stream

### Backend Role (RTMS SDK - `@zoom/rtms`)
- Lives on your server (Node.js)
- Receives webhook from Zoom when RTMS starts
- Uses `new rtms.Client()` to **connect to the stream**
- Handles the actual audio/transcript data
- Saves data to disk

## Why Both Are Needed

1. **Frontend triggers** RTMS because:
   - It knows the engagement context
   - It has the user interaction
   - It's inside the Zoom client

2. **Backend handles** the stream because:
   - Browsers can't handle raw media streams
   - Backend has access to file system
   - Backend can maintain persistent connections
   - Backend has the credentials for authentication

## Testing the Complete Flow

1. **Start containers**:
   ```bash
   docker-compose up
   ```

2. **Start ngrok**:
   ```bash
   npm run ngrok
   ```

3. **Open Zoom Contact Center** and start engagement

4. **Click "Start RTMS"** in your app

5. **Watch the logs**:
   ```bash
   # Terminal 1: Backend logs
   npm run logs:backend

   # Terminal 2: RTMS logs
   npm run logs:rtms
   ```

You should see:
```
# Backend
Webhook received: meeting.rtms_started
Forwarded meeting.rtms_started to RTMS server

# RTMS Server
📥 ZCC RTMS Webhook received
Event: meeting.rtms_started
[engagement-id] Configuring audio parameters...
[engagement-id] Generating RTMS signature...
[engagement-id] Joining RTMS stream...
✓ [engagement-id] Successfully connected to RTMS stream
[engagement-id] Audio data received: 640 bytes
[engagement-id] Transcript: Agent: Hello!
```

## Common Confusion

### "Why not just use the frontend SDK for everything?"

The `@zoom/appssdk` (frontend) can only **trigger** RTMS. It can't:
- ❌ Receive audio streams (browsers have security restrictions)
- ❌ Save files to disk
- ❌ Maintain persistent WebSocket connections
- ❌ Handle concurrent engagements

The `@zoom/rtms` (backend) is designed for:
- ✅ Receiving raw media streams over WebSocket
- ✅ Processing audio/video data
- ✅ Saving to disk
- ✅ Running 24/7 as a service

### "Why not start RTMS from the backend directly?"

You **could** theoretically use Zoom's REST API to start RTMS, but:
- The frontend approach is simpler (one SDK call)
- The frontend knows the engagement context
- It follows Zoom's recommended pattern
- User interaction confirms intent

## The Two SDKs

| Feature | @zoom/appssdk (Frontend) | @zoom/rtms (Backend) |
|---------|-------------------------|---------------------|
| **Purpose** | Zoom app UI & controls | Media stream processing |
| **Runs in** | Zoom client (browser context) | Node.js server |
| **Initiates RTMS** | ✅ Yes (`startRTMS()`) | ❌ No |
| **Receives streams** | ❌ No | ✅ Yes (`client.join()`) |
| **File system** | ❌ No | ✅ Yes |
| **Authentication** | OAuth | HMAC signature |

## Summary

You were correct to question this! The **frontend initiates** RTMS, and the **backend handles** the stream. Both work together:

1. ✅ Frontend: Fixed `callZoomApi('startRTMS')` → `startRTMS()`
2. ✅ Backend: Already correct - receives webhook and connects to stream

The implementation is now **complete and correct** end-to-end!

---

**Sources:**
- [Zoom Apps SDK Documentation](https://developers.zoom.us/docs/zoom-apps/)
- [RTMS GitHub Repository](https://github.com/zoom/rtms)
- [RTMS Quickstart](https://github.com/zoom/rtms-quickstart-js)
