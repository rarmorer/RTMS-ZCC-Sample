import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache of open write streams keyed by file path
const writeStreams = new Map();


export function makeSessionTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

export function getChannelRawPath(sessionDir, channelId) {
  return path.join(sessionDir, `channel_${channelId}.raw`);
}

export function getChannelWavPath(sessionDir, channelId) {
  return path.join(sessionDir, `channel_${channelId}.wav`);
}

export function saveRawAudio(chunk, rawPath) {
  const dir = path.dirname(rawPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let stream = writeStreams.get(rawPath);
  if (!stream) {
    stream = fs.createWriteStream(rawPath, { flags: 'a' });
    writeStreams.set(rawPath, stream);
  }

  stream.write(chunk);
}

export async function convertRawToWav(inputFile, outputFile, options = {}) {
  const sampleRate = options.sampleRate || 16000;
  const channels = options.channels || 1;
  const command = `ffmpeg -y -f s16le -ar ${sampleRate} -ac ${channels} -i "${inputFile}" "${outputFile}"`;
  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`FFmpeg conversion failed: ${error.message}`);
  }
}

export function closeRawStream(rawPath) {
  const stream = writeStreams.get(rawPath);
  if (!stream) return Promise.resolve();
  return new Promise((resolve) => {
    stream.end(() => {
      writeStreams.delete(rawPath);
      resolve();
    });
  });
}

export function closeAllAudioStreams() {
  const promises = Array.from(writeStreams.entries()).map(([, stream]) =>
    new Promise((resolve) => stream.end(resolve))
  );
  writeStreams.clear();
  return Promise.all(promises);
}
