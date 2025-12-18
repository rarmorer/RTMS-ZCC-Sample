import rtms from '@zoom/rtms';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, createWriteStream } from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import wav from 'wav';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env file
dotenv.config({ path: join(__dirname, '../.env') });

// The @zoom/rtms SDK creates its own HTTP server on port 8080 by default
// We use the PORT env var to match what's configured in docker-compose.yml
const PORT = process.env.PORT || 8080;

// Backend URL for sending transcript data
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

// Store active RTMS clients and streams (engagement-aware)
const activeEngagements = new Map();

// Send transcript data to backend for real-time processing
async function sendTranscriptToBackend(transcriptData) {
  try {
    await axios.post(`${BACKEND_URL}/api/rtms/transcript`, transcriptData);
    console.log(`✓ Sent transcript to backend for analysis`);
  } catch (error) {
    console.error(`✗ Failed to send transcript to backend:`, error.message);
  }
}

// Ensure data directories exist
const dataDir = join(__dirname, 'data');
const audioDir = join(dataDir, 'audio');
const transcriptsDir = join(dataDir, 'transcripts');

[dataDir, audioDir, transcriptsDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

console.log('='.repeat(70));
console.log('ZCC RTMS Server');
console.log('='.repeat(70));
console.log(`Port: ${PORT}`);
console.log(`Data directory: ${dataDir}`);
console.log(`Transcripts directory: ${transcriptsDir}`);
console.log(`Audio directory: ${audioDir}`);
console.log('='.repeat(70));
console.log('Setting up webhook event handler...\n');

// Use the official rtms.onWebhookEvent() pattern from the README
// Supports both Zoom Contact Center (ZCC) and regular Zoom Meetings
//
// ZCC Events: contact_center.voice_rtms_started / contact_center.voice_rtms_stopped
// Meeting Events: meeting.rtms_started / meeting.rtms_stopped
//
// Signature Generation (handled internally by SDK):
// - ZCC: HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)
// - Meeting: HMACSHA256(client_id + "," + meeting_uuid + "," + rtms_stream_id, secret)
rtms.onWebhookEvent(({event, payload}) => {
  const isZCC = event.startsWith('contact_center.');
  const isMeeting = event.startsWith('meeting.');
  const context = isZCC ? 'ZCC' : isMeeting ? 'Meeting' : 'Unknown';

  console.log('\n' + '='.repeat(70));
  console.log(`📥 ${context} RTMS Webhook Event Received`);
  console.log('='.repeat(70));
  console.log('Event:', event);
  console.log('Context:', context);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('='.repeat(70) + '\n');

  // Handle RTMS started events (both ZCC and Meeting)
  if (event === 'contact_center.voice_rtms_started' || event === 'meeting.rtms_started') {
    console.log(`🎤 Audio capture starting for ${context}...\n`);
    handleRTMSStarted(payload, context);
  }
  // Handle RTMS stopped events (both ZCC and Meeting)
  else if (event === 'contact_center.voice_rtms_stopped' || event === 'meeting.rtms_stopped') {
    console.log(`🛑 Audio capture stopping for ${context}...\n`);
    handleRTMSStopped(payload, context);
  }
  else {
    console.log(`ℹ Ignoring unknown event: ${event}\n`);
  }
});

// Handle RTMS started event (supports both ZCC and Meeting contexts)
async function handleRTMSStarted(payload, context = 'Unknown') {
  // Extract ID based on context:
  // - ZCC uses engagement_id
  // - Meetings use meeting_uuid
  const engagementId = payload.engagement_id || payload.meeting_uuid;
  const rtmsStreamId = payload.rtms_stream_id;

  if (!engagementId || !rtmsStreamId) {
    console.error(`✗ Invalid ${context} payload - missing engagement_id/meeting_uuid or rtms_stream_id`);
    return;
  }

  console.log(`[${context}] [${engagementId}] Starting RTMS connection...`);

  // Check if a client already exists for this stream (per get-audio.md line 69)
  if (activeEngagements.has(engagementId)) {
    console.warn(`[${engagementId}] RTMS client already exists for this stream, skipping creation`);
    return;
  }

  // Create a new RTMS client for the stream if it doesn't exist
  const client = new rtms.Client();

  // Setup transcript file with context-aware naming
  const safeEngagementId = engagementId.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const contextPrefix = context === 'ZCC' ? 'zcc' : 'meeting';
  const transcriptFilename = `transcript_${contextPrefix}_${safeEngagementId}_${timestamp}.txt`;
  const transcriptPath = join(transcriptsDir, transcriptFilename);

  const transcriptStream = createWriteStream(transcriptPath, { flags: 'a' });
  transcriptStream.write(`=== ${context} RTMS Transcript Started at ${new Date().toISOString()} ===\n`);
  transcriptStream.write(`Context: ${context}\n`);
  transcriptStream.write(`${context === 'ZCC' ? 'Engagement' : 'Meeting'} ID: ${engagementId}\n`);
  transcriptStream.write(`Stream ID: ${rtmsStreamId}\n`);
  transcriptStream.write(`${'='.repeat(70)}\n\n`);

  // Setup WAV file writer for real-time audio capture
  // Zoom RTMS provides PCM audio at 16kHz, 16-bit, mono
  const audioFilename = `audio_${contextPrefix}_${safeEngagementId}_${timestamp}.wav`;
  const audioPath = join(audioDir, audioFilename);

  const wavWriter = new wav.FileWriter(audioPath, {
    sampleRate: 16000,    // 16kHz from Zoom RTMS
    channels: 1,          // Mono audio
    bitDepth: 16          // 16-bit PCM
  });

  console.log(`[${engagementId}] 🎵 WAV file initialized: ${audioPath}`);

  // Handle audio data with enhanced logging and real-time WAV writing
  client.onAudioData((data, timestamp, metadata) => {
    const engData = activeEngagements.get(engagementId);
    if (engData) {
      engData.audioChunkCount++;
    }

    console.log(`[${engagementId}] 🔊 Audio data received: ${data.length} bytes at timestamp ${timestamp}`);
    if (metadata?.userName) {
      console.log(`[${engagementId}]    👤 Speaker: ${metadata.userName}`);
    }
    if (metadata?.userId) {
      console.log(`[${engagementId}]    🆔 User ID: ${metadata.userId}`);
    }
    console.log(`[${engagementId}]    📦 Total audio chunks captured: ${engData?.audioChunkCount || 0}`);

    // Write PCM audio data directly to WAV file (real-time compression)
    // The wav library handles WAV header and proper encoding
    wavWriter.write(data);
  });

  // Handle transcript data with enhanced logging
  client.onTranscriptData((data, timestamp, metadata, user) => {
    const text = data.toString('utf-8');
    const userName = user?.userName || metadata?.userName || 'Unknown';
    const userId = user?.userId || metadata?.userId || 'unknown';
    const date = new Date(timestamp);

    const line = `[${date.toISOString()}] ${userName}: ${text}\n`;
    transcriptStream.write(line);

    console.log(`[${engagementId}] 💬 Transcript received:`);
    console.log(`[${engagementId}]    👤 Speaker: ${userName} (ID: ${userId})`);
    console.log(`[${engagementId}]    ⏱️  Timestamp: ${date.toISOString()}`);
    console.log(`[${engagementId}]    📝 Text: "${text}"`);

    // Send transcript to backend for real-time AI analysis
    sendTranscriptToBackend({
      text,
      speaker: userName,
      userId,
      timestamp: date.toISOString(),
      engagementId,
      context
    });
  });

  // Store engagement data with context
  activeEngagements.set(engagementId, {
    client,
    transcriptStream,
    transcriptPath,
    wavWriter,
    audioPath,
    audioChunkCount: 0,
    timestamp,
    rtmsStreamId,
    context,  // Store context (ZCC or Meeting) for proper file naming
    startedAt: new Date().toISOString()
  });

  // Join the RTMS session using the webhook payload
  // The @zoom/rtms SDK handles signature generation internally based on context:
  // - ZCC: HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret)
  // - Meeting: HMACSHA256(client_id + "," + meeting_uuid + "," + rtms_stream_id, secret)
  try {
    console.log(`[${context}] [${engagementId}] 🔗 Joining RTMS stream...`);
    console.log(`[${context}] [${engagementId}]    Stream ID: ${rtmsStreamId}`);
    console.log(`[${context}] [${engagementId}]    Server URLs: ${payload.server_urls || 'default'}`);
    console.log(`[${context}] [${engagementId}]    ${context === 'ZCC' ? 'Engagement' : 'Meeting'} ID: ${engagementId}`);
    console.log(`[${context}] [${engagementId}]    🔐 SDK generating ${context} signature internally...`);

    await client.join(payload);

    // Successfully joined - log confirmation
    console.log('\n' + '='.repeat(70));
    console.log(`🚨 [${engagementId}] AUDIO IS BEING CAPTURED 🚨`);
    console.log('='.repeat(70));
    console.log(`✓ [${context}] [${engagementId}] ✅ SDK successfully joined RTMS stream`);
    console.log(`✓ [${context}] [${engagementId}] 🎧 Audio handlers registered`);
    console.log(`✓ [${context}] [${engagementId}] 📝 Transcript handlers registered`);
    console.log(`✓ [${context}] [${engagementId}] Waiting for audio data and transcripts...`);
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error(`✗ [${engagementId}] FAILED TO JOIN RTMS STREAM`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error('='.repeat(70) + '\n');
    transcriptStream.end();
    activeEngagements.delete(engagementId);
  }
}

// Handle RTMS stopped event (supports both ZCC and Meeting contexts)
async function handleRTMSStopped(payload, context = 'Unknown') {
  const engagementId = payload.engagement_id || payload.meeting_uuid;

  if (!engagementId) {
    console.error(`✗ Invalid ${context} payload - missing engagement_id/meeting_uuid`);
    return;
  }

  console.log(`[${context}] [${engagementId}] Stopping RTMS...`);
  await cleanupEngagement(engagementId);
}

// Clean up engagement resources
async function cleanupEngagement(engagementId) {
  const engagementData = activeEngagements.get(engagementId);

  if (!engagementData) {
    console.warn(`[${engagementId}] No active RTMS client found`);
    return;
  }

  const { client, transcriptStream, transcriptPath, wavWriter, audioPath, audioChunkCount } = engagementData;

  try {
    // Close transcript stream
    transcriptStream.write(`\n${'='.repeat(70)}\n`);
    transcriptStream.write(`=== Transcript Ended at ${new Date().toISOString()} ===\n`);
    transcriptStream.write(`Total Duration: ${Math.floor((Date.now() - new Date(engagementData.startedAt).getTime()) / 1000)} seconds\n`);
    transcriptStream.end();

    console.log(`✓ [${engagementId}] Transcript saved: ${transcriptPath}`);

    // Close WAV file writer
    if (wavWriter) {
      await new Promise((resolve, reject) => {
        wavWriter.end((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✓ [${engagementId}] WAV audio file saved: ${audioPath}`);

      // Calculate and display WAV file size
      const fs = await import('fs/promises');
      try {
        const stats = await fs.stat(audioPath);
        console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        console.log(`  Format: WAV (16kHz, 16-bit, Mono)`);
        console.log(`  Audio chunks captured: ${audioChunkCount}`);
      } catch (statErr) {
        console.log(`  Audio chunks captured: ${audioChunkCount}`);
      }
    } else if (audioChunkCount === 0) {
      console.log(`ℹ [${engagementId}] No audio data captured`);
    }

    // Leave the RTMS session
    await client.leave();
    console.log(`✓ [${engagementId}] Left RTMS stream`);
  } catch (error) {
    console.error(`✗ [${engagementId}] Cleanup error:`, error.message);
  } finally {
    activeEngagements.delete(engagementId);
    console.log(`✓ [${engagementId}] Cleaned up\n`);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');

  for (const [engagementId] of activeEngagements.entries()) {
    console.log(`Cleaning up engagement: ${engagementId}`);
    await cleanupEngagement(engagementId);
  }

  activeEngagements.clear();
  console.log('All engagements cleaned up. Goodbye!');
  process.exit(0);
});

// Log active engagements periodically
setInterval(() => {
  if (activeEngagements.size > 0) {
    console.log(`\n📊 Active Engagements: ${activeEngagements.size}`);
    for (const [engagementId, data] of activeEngagements.entries()) {
      const duration = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
      console.log(`  - ${engagementId}: ${duration}s (${data.audioChunkCount} audio chunks)`);
    }
    console.log('');
  }
}, 30000);

console.log('✅ RTMS webhook handler ready');
console.log(`📡 Listening on port ${PORT}\n`);
console.log('Waiting for meeting.rtms_started webhooks...\n');
