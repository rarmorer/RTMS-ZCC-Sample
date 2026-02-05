/**
 * Simple in-memory token storage for Zoom OAuth tokens
 * This is needed because session cookies don't work in Zoom iframe apps
 *
 * In production, tokens should be stored in Redis keyed by user/account ID
 */

let tokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null
};

function setTokens({ accessToken, refreshToken, expiresAt }) {
  tokens.accessToken = accessToken;
  tokens.refreshToken = refreshToken;
  tokens.expiresAt = expiresAt;
  console.log('Tokens stored in global storage');
}

function getTokens() {
  return tokens;
}

function clearTokens() {
  tokens.accessToken = null;
  tokens.refreshToken = null;
  tokens.expiresAt = null;
}

function hasValidToken() {
  return !!tokens.accessToken && (!tokens.expiresAt || tokens.expiresAt > Date.now());
}

module.exports = {
  setTokens,
  getTokens,
  clearTokens,
  hasValidToken
};
