const { zoomApiRequest } = require('../helpers/zoom-api');
const { getTokens } = require('../helpers/token-store');

/**
 * Handle RTMS control - Start/Stop RTMS for an engagement
 */
async function handleRtmsControl(req, res) {
  console.log('handleRtmsControl called');
  console.log('Request body:', req.body);

  const { engagementId, action } = req.body;
  const clientId = process.env.ZOOM_APP_CLIENT_ID;

  if (!engagementId || !action) {
    console.error('Missing required fields:', { engagementId, action });
    return res.status(400).json({
      error: 'Missing required fields: engagementId, action'
    });
  }

  // Try to get tokens from session first, then fall back to global storage
  const globalTokens = getTokens();
  const tokens = {
    accessToken: req.session.accessToken || globalTokens.accessToken,
    refreshToken: req.session.refreshToken || globalTokens.refreshToken
  };

  console.log('Token check:', {
    hasSessionToken: !!req.session.accessToken,
    hasGlobalToken: !!globalTokens.accessToken,
    usingToken: !!tokens.accessToken
  });

  if (!tokens.accessToken) {
    console.error('User not authenticated - no access token available');
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please authenticate with Zoom first'
    });
  }

  if (!clientId) {
    console.error('ZOOM_APP_CLIENT_ID not configured in environment');
    return res.status(500).json({
      error: 'Server configuration error: Client ID not found'
    });
  }

  if (action !== 'start' && action !== 'stop') {
    console.error('Invalid action:', action);
    return res.status(400).json({
      error: 'Invalid action. Must be "start" or "stop"'
    });
  }

  try {
    // Use the specific Zoom Contact Center API endpoint
    const zoomApiUrl = `https://goocicci.zoom.us/v2/contact_center/${engagementId}/rtms_app/status`;

    console.log(`${action.toUpperCase()} RTMS for engagement: ${engagementId}`);
    console.log('Zoom API URL:', zoomApiUrl);

    // Use zoomApiRequest for automatic token refresh
    const data = await zoomApiRequest({
      method: 'PUT',
      url: zoomApiUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        action: action,
        settings: {
          client_id: clientId
        }
      }
    }, tokens);

    console.log(`RTMS ${action} successful:`, data);

    res.json({
      success: true,
      action: action,
      engagementId: engagementId,
      data: data
    });
  } catch (error) {
    console.error(`RTMS ${action} failed:`, error.response?.data || error.message);

    // If authentication failed after refresh attempt, return 401
    if (error.message === 'Authentication failed - please re-authenticate') {
      return res.status(401).json({
        error: 'Authentication expired',
        message: 'Please re-authenticate with Zoom',
        needsAuth: true
      });
    }

    res.status(error.response?.status || 500).json({
      error: `Failed to ${action} RTMS`,
      details: error.response?.data || error.message
    });
  }
}

module.exports = {
  handleRtmsControl
};
