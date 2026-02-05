/**
 * Redis-backed token storage for Zoom OAuth tokens
 * This is needed because session cookies don't work in Zoom iframe apps
 *
 * Tokens are stored in Redis with key "oauth:tokens" for persistence
 */

const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Token store Redis max reconnection attempts reached');
        return new Error('Redis max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Token Store Redis Error:', err);
});

// Connect to Redis
redisClient.connect().catch(console.error);

const REDIS_TOKEN_KEY = 'oauth:tokens';

/**
 * Store tokens in Redis
 * @param {Object} tokens - Token object with accessToken, refreshToken, expiresAt
 */
async function setTokens({ accessToken, refreshToken, expiresAt }) {
  try {
    await redisClient.set(REDIS_TOKEN_KEY, JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt
    }));
    console.log('Tokens stored in Redis');
  } catch (error) {
    console.error('Failed to store tokens in Redis:', error);
    throw error;
  }
}

/**
 * Get tokens from Redis
 * @returns {Object} Token object with accessToken, refreshToken, expiresAt
 */
async function getTokens() {
  try {
    const data = await redisClient.get(REDIS_TOKEN_KEY);
    if (!data) {
      return { accessToken: null, refreshToken: null, expiresAt: null };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get tokens from Redis:', error);
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

/**
 * Clear tokens from Redis
 */
async function clearTokens() {
  try {
    await redisClient.del(REDIS_TOKEN_KEY);
    console.log('Tokens cleared from Redis');
  } catch (error) {
    console.error('Failed to clear tokens from Redis:', error);
  }
}

/**
 * Check if a valid token exists
 * @returns {Promise<boolean>}
 */
async function hasValidToken() {
  const tokens = await getTokens();
  return !!tokens.accessToken && (!tokens.expiresAt || tokens.expiresAt > Date.now());
}

module.exports = {
  setTokens,
  getTokens,
  clearTokens,
  hasValidToken
};
