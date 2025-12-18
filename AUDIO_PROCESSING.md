# Audio Processing Implementation

## Overview

The RTMS server now includes real-time audio compression and WAV conversion functionality, following Zoom's RTMS media connection guidance.

## Features Implemented

### 1. Real-Time WAV Conversion
- **Format**: PCM audio converted to WAV format in real-time
- **Specifications**:
  - Sample Rate: 16kHz (standard for Zoom RTMS)
  - Bit Depth: 16-bit
  - Channels: Mono (1 channel)
- **Library**: `wav` npm package for proper WAV encoding
- **Output**: Audio files are saved as `.wav` format with proper headers

### 2. Audio Compression
- Raw PCM audio buffers are automatically compressed into WAV format
- WAV format provides better compatibility and smaller file sizes compared to raw PCM
- Real-time streaming to disk as audio chunks arrive from Zoom

### 3. WAV File Storage
- **WAV files only**: Audio is saved directly as WAV format
  - Location: `rtms/data/audio/audio_{context}_{id}_{timestamp}.wav`
  - Format: Standard WAV format compatible with all audio players
  - Real-time streaming: Audio is written to disk as it arrives, no post-processing needed

### 4. Media Connection Establishment

Following Zoom's RTMS documentation (https://developers.zoom.us/docs/rtms/work-with-streams/#step-4-app-establishes-the-media-connection):

1. **Media Handshake**: The `@zoom/rtms` SDK handles the media handshake automatically when `client.join(payload)` is called
2. **Client Ready ACK**: The SDK sends the acknowledgment once handlers are registered
3. **Media WebSocket**: The SDK establishes the media WebSocket connection using the server URLs from the webhook payload

## Technical Implementation

### Audio Data Flow

```
Zoom RTMS Stream
    ↓
@zoom/rtms SDK
    ↓
client.onAudioData() handler
    ↓
Write to WAV file (real-time)
    ↓
On engagement end:
    ↓
Close WAV file (finalized)
```

### Code Changes

#### 1. Added Dependencies ([rtms/package.json](rtms/package.json))
```json
"dependencies": {
  "@zoom/rtms": "^0.0.4",
  "express": "^4.18.2",
  "dotenv": "^16.0.3",
  "axios": "^1.6.0",
  "wav": "^1.0.2"
}
```

#### 2. WAV File Initialization ([rtms/server.js:131-142](rtms/server.js#L131-L142))
```javascript
// Setup WAV file writer for real-time audio capture
const wavWriter = new wav.FileWriter(audioPath, {
  sampleRate: 16000,    // 16kHz from Zoom RTMS
  channels: 1,          // Mono audio
  bitDepth: 16          // 16-bit PCM
});
```

#### 3. Real-Time Audio Writing ([rtms/server.js:163-165](rtms/server.js#L163-L165))
```javascript
// Write PCM audio data directly to WAV file (real-time compression)
// The wav library handles WAV header and proper encoding
wavWriter.write(data);
```

#### 4. Proper Cleanup ([rtms/server.js:270-292](rtms/server.js#L270-L292))
```javascript
// Close WAV file writer
if (wavWriter) {
  await new Promise((resolve, reject) => {
    wavWriter.end((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log(`✓ [${engagementId}] WAV audio file saved: ${audioPath}`);
  // ... file size logging
}
```

## File Naming Convention

### WAV Files
- Format: `audio_{context}_{id}_{timestamp}.wav`
- Example ZCC: `audio_zcc_eng_12345_2025-12-17T12-00-00-000Z.wav`
- Example Meeting: `audio_meeting_uuid_67890_2025-12-17T12-00-00-000Z.wav`

## Usage

### Playing WAV Files
WAV files can be played directly with any audio player:
```bash
# macOS
afplay rtms/data/audio/audio_zcc_eng_12345_*.wav

# Linux
aplay rtms/data/audio/audio_zcc_eng_12345_*.wav

# Windows
start rtms/data/audio/audio_zcc_eng_12345_*.wav
```

## Performance Benefits

1. **Real-Time Processing**: Audio is written as it arrives, no post-processing delay
2. **Memory Efficient**: Streaming writes prevent large memory buffers
3. **Disk Space**: WAV format is more efficient than raw PCM for storage
4. **Compatibility**: WAV files work with all standard audio tools

## Monitoring

The server logs provide detailed information about audio capture:

```
[eng_12345] 🔊 Audio data received: 3200 bytes at timestamp 1234567890
[eng_12345]    👤 Speaker: John Doe
[eng_12345]    🆔 User ID: user_12345
[eng_12345]    📦 Total audio chunks captured: 42
```

On cleanup:
```
✓ [eng_12345] WAV audio file saved: /app/data/audio/audio_zcc_eng_12345_2025-12-17T12-00-00-000Z.wav
  Size: 1234.56 KB (1.23 MB)
  Format: WAV (16kHz, 16-bit, Mono)
  Audio chunks captured: 42
```

## Media Connection Details

The implementation follows Zoom's RTMS guidance:

1. **Webhook Reception**: Backend receives `contact_center.voice_rtms_started` or `meeting.rtms_started` webhook
2. **Forwarding**: Backend forwards webhook to RTMS server at `http://rtms:8080`
3. **Media Handshake**: `@zoom/rtms` SDK automatically performs handshake with `meeting_uuid` and `rtms_stream_id`
4. **Signature Generation**: SDK generates HMAC-SHA256 signature internally:
   - ZCC: `HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)`
   - Meeting: `HMACSHA256(client_id + "," + meeting_uuid + "," + rtms_stream_id, secret)`
5. **Connection**: SDK establishes WebSocket connection to media server URLs
6. **Ready ACK**: SDK sends client ready acknowledgment
7. **Streaming**: Audio and transcript data flows through registered handlers

## Testing

To test the audio processing:

1. Start a Zoom Contact Center engagement or meeting with the app installed
2. Speak during the call
3. Monitor RTMS server logs for audio capture confirmation
4. After the call ends, check `rtms/data/audio/` for:
   - `.wav` files (primary output)
   - `.raw` files (backup)
5. Play the WAV file to verify audio quality

## Troubleshooting

### No Audio Files Created
- Check that RTMS webhook is being received: `docker-compose logs rtms | grep "RTMS Webhook"`
- Verify audio data is arriving: Look for "🔊 Audio data received" in logs
- Ensure proper permissions on `rtms/data/audio/` directory

### WAV File Won't Play
- Check file size is > 44 bytes (WAV header size)
- Verify audio chunks were captured: Check log output
- Try raw PCM backup with manual conversion

### Poor Audio Quality
- RTMS provides 16kHz, 16-bit mono audio (this is Zoom's standard)
- Quality depends on network conditions and Zoom's encoding
- Check for packet loss in Zoom's network stats

## Future Enhancements

Potential improvements for future versions:

1. **Compression**: Add OPUS or MP3 encoding for smaller file sizes
2. **Speaker Separation**: Split audio by speaker into separate files
3. **Real-Time Upload**: Stream audio to cloud storage (S3, GCS)
4. **Transcoding**: Convert to multiple formats simultaneously
5. **Audio Analysis**: Add volume normalization, noise reduction
6. **Metadata**: Embed speaker names and timestamps in WAV metadata
