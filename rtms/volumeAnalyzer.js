// volumeAnalyzer.js
// Measures RMS volume of raw 16-bit PCM audio chunks per channel.
// Maintains a rolling window and fires a callback when volume crosses
// the HIGH_VOLUME_THRESHOLD — used as a proxy for customer agitation.

const WINDOW_SIZE   = 20;     // chunks (~400ms at 20ms/chunk)
const HIGH_THRESHOLD = 0.10;  // lowered from 0.15 to catch screaming — Zoom AGC normalises levels
const LOW_THRESHOLD  = 0.06;  // lowered from 0.08 to match new high threshold
const DEBOUNCE_MS    = 5000;  // minimum ms between sentiment events per channel
const LOG_EVERY      = 100;   // log rolling RMS every N chunks (for calibration)

// channelId → { window: number[], elevated: bool, lastFiredAt: number, chunkCount: number }
const channelState = new Map();

function rms(buffer) {
  // Copy into a fresh ArrayBuffer to avoid Node.js buffer pool offset issues
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const samples = new Int16Array(ab);
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length) / 32768; // normalise to 0–1
}

// Call this for every audio chunk.
// onElevated(channelId, avgRms) fires when sustained high volume is detected.
// onCalmed(channelId)           fires when volume drops back down.
export function analyzeChunk(channelId, audioBuffer, onElevated, onCalmed) {
  if (!channelState.has(channelId)) {
    channelState.set(channelId, { window: [], elevated: false, lastFiredAt: 0 });
  }

  const state = channelState.get(channelId);
  const chunkRms = rms(audioBuffer);
  state.chunkCount = (state.chunkCount || 0) + 1;

  state.window.push(chunkRms);
  if (state.window.length > WINDOW_SIZE) state.window.shift();

  const avg = state.window.reduce((a, b) => a + b, 0) / state.window.length;

  if (state.chunkCount % LOG_EVERY === 0) {
    console.log(`[volume] channel ${channelId} — avg RMS: ${avg.toFixed(4)} (threshold: ${HIGH_THRESHOLD})`);
  }
  const now = Date.now();

  if (!state.elevated && avg >= HIGH_THRESHOLD && (now - state.lastFiredAt) > DEBOUNCE_MS) {
    state.elevated = true;
    state.lastFiredAt = now;
    onElevated(channelId, avg);
  } else if (state.elevated && avg < LOW_THRESHOLD) {
    state.elevated = false;
    onCalmed(channelId);
  }
}

export function removeChannel(channelId) {
  channelState.delete(channelId);
}
