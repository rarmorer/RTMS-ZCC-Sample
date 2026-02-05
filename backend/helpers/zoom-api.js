const axios = require('axios');
const { setTokens } = require('./token-store');

/**
 * Make a token request to Zoom OAuth endpoint
 * @param {Object} params - OAuth parameters
 * @param {string} clientId - Zoom client ID (optional, defaults to env)
 * @param {string} clientSecret - Zoom client secret (optional, defaults to env)
 * @returns {Promise} Token response data
 */
function tokenRequest(params, clientId = '', clientSecret = '') {
  const username = clientId || process.env.ZOOM_APP_CLIENT_ID;
  const password = clientSecret || process.env.ZOOM_APP_CLIENT_SECRET;

  const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

  return axios({
    data: new URLSearchParams(params).toString(),
    baseURL: process.env.ZOOM_HOST || 'https://zoom.us',
    url: '/oauth/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then(({ data }) => Promise.resolve(data));
}

/**
 * Refresh an expired access token using a refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise} New token data with access_token and refresh_token
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new Error('refresh token must be a valid string');
  }

  return tokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
}

/**
 * Make an API call to Zoom with automatic token refresh on 401
 * @param {Object} options - Axios request options
 * @param {Object} tokens - Token object with accessToken and refreshToken
 * @returns {Promise} API response data
 */
async function zoomApiRequest(options, tokens) {
  const accessToken = tokens.accessToken;

  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    // Try the request with current access token
    const response = await axios({
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    // If 401 Unauthorized, try to refresh the token
    if (error.response?.status === 401 && tokens.refreshToken) {
      console.log('Access token expired, attempting refresh...');

      try {
        // Refresh the token
        const tokenData = await refreshAccessToken(tokens.refreshToken);

        // Update global token store with new tokens
        setTokens({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000)
        });

        console.log('Token refreshed successfully');

        // Retry the original request with new token
        const retryResponse = await axios({
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        return retryResponse.data;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        throw new Error('Authentication failed - please re-authenticate');
      }
    }

    // Re-throw original error if not a 401 or no refresh token available
    throw error;
  }
}

module.exports = {
  tokenRequest,
  refreshAccessToken,
  zoomApiRequest,
};
