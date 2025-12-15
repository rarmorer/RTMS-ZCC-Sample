import React, { useState, useEffect, useCallback } from 'react';
import zoomSdk from '@zoom/appssdk';
import './App.css';

function App() {
  const [zoomInitialized, setZoomInitialized] = useState(false);
  const [runningContext, setRunningContext] = useState('');

  // ZCC-specific state
  const [engagementContext, setEngagementContext] = useState(null);
  const [engagementStatus, setEngagementStatus] = useState(null);
  const [consumerContext, setConsumerContext] = useState(null);

  // Meeting-specific state
  const [meetingContext, setMeetingContext] = useState(null);
  const [meetingUUID, setMeetingUUID] = useState(null);
  const [userContext, setUserContext] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rtmsStatus, setRtmsStatus] = useState('waiting'); // 'waiting', 'ready', 'capturing', 'error'

  // Fetch ZCC engagement context
  const fetchEngagementContext = useCallback(async () => {
    try {
      const engagementCtx = await zoomSdk.getEngagementContext();
      setEngagementContext(engagementCtx.engagementContext);
      console.log('Engagement context:', engagementCtx.engagementContext);
      return engagementCtx.engagementContext;
    } catch (err) {
      console.error('Failed to get engagement context:', err);
      return null;
    }
  }, []);

  // Fetch ZCC engagement status
  const fetchEngagementStatus = useCallback(async (engagementId) => {
    if (!engagementId) {
      console.log('No engagement ID available');
      return;
    }

    try {
      const status = await zoomSdk.getEngagementStatus({
        engagementId: engagementId
      });
      setEngagementStatus(status.engagementStatus);
      console.log('Engagement status:', status.engagementStatus);
    } catch (err) {
      console.error('Failed to get engagement status:', err);
    }
  }, []);

  // Fetch Meeting context
  const fetchMeetingContext = useCallback(async () => {
    try {
      const [meeting, uuid, user] = await Promise.all([
        zoomSdk.getMeetingContext(),
        zoomSdk.getMeetingUUID(),
        zoomSdk.getUserContext()
      ]);

      setMeetingContext(meeting);
      setMeetingUUID(uuid.meetingUUID);
      setUserContext(user);

      console.log('Meeting context:', meeting);
      console.log('Meeting UUID:', uuid.meetingUUID);
      console.log('User context:', user);
    } catch (err) {
      console.error('Failed to get meeting context:', err);
    }
  }, []);

  // Initialize Zoom SDK
  useEffect(() => {
    async function initializeZoomSdk() {
      try {
        // Configure with capabilities for BOTH ZCC and Meetings
        const configResponse = await zoomSdk.config({
          version: '0.16.0',
          popoutSize: { width: 480, height: 360 },
          capabilities: [
            // Standard capabilities
            'authorize',
            'onAuthorized',
            'getUserContext',
            'getRunningContext',

            // ZCC-specific capabilities
            'getEngagementContext',
            'getEngagementStatus',
            'getEngagementVariableValue',
            'onEngagementContextChange',
            'onEngagementStatusChange',
            'onEngagementVariableValueChange',

            // Meeting-specific capabilities
            'getMeetingContext',
            'getMeetingUUID',
            'getMeetingParticipants',
            'onMeeting',
            'onParticipantChange',
            'onActiveSpeakerChange'
          ]
        });

        console.log('Zoom SDK configured:', configResponse);
        setZoomInitialized(true);

        // Get running context
        const context = await zoomSdk.getRunningContext();
        setRunningContext(context.context);
        console.log('Running context:', context.context);

        // Set initial RTMS status
        if (context.context === 'inContactCenter' || context.context === 'inMeeting') {
          setRtmsStatus('ready');
        }

        // Fetch context based on running environment
        if (context.context === 'inContactCenter') {
          setMessage('Zoom SDK initialized for Contact Center');

          // Fetch ZCC-specific context
          const engCtx = await fetchEngagementContext();

          if (engCtx?.engagementId) {
            await fetchEngagementStatus(engCtx.engagementId);
          }

          // Try to get consumer context
          try {
            const consCtx = await zoomSdk.getEngagementStatus();
            setConsumerContext(consCtx.consumers?.[0]);
          } catch (err) {
            console.log('No consumer context available yet');
          }

          // Listen for ZCC engagement status changes
          zoomSdk.onEngagementStatusChange(async (event) => {
            console.log('Engagement status changed:', event);
            const newStatus = event.engagementStatus;
            setEngagementStatus(newStatus);

            // Handle engagement state and update RTMS status
            if (newStatus?.state === 'end') {
              setMessage('Engagement ended. RTMS data saved to server.');
              setRtmsStatus('ready');
            } else if (newStatus?.state === 'active') {
              setMessage('Engagement is active. RTMS is capturing audio/transcripts automatically.');
              setRtmsStatus('capturing');
            } else if (newStatus?.state === 'wrap-up') {
              setMessage('Engagement in wrap-up');
              setRtmsStatus('ready');
            }
          });

        } else if (context.context === 'inMeeting') {
          setMessage('Zoom SDK initialized for Meeting');

          // Fetch Meeting-specific context
          await fetchMeetingContext();

          // Listen for meeting events
          zoomSdk.onMeeting((event) => {
            console.log('Meeting event:', event);
            setMessage(`Meeting event: ${event.status}`);

            // Update RTMS status based on meeting state
            if (event.status === 'started' || event.status === 'connected') {
              setRtmsStatus('capturing');
            } else if (event.status === 'ended' || event.status === 'left') {
              setRtmsStatus('ready');
            }
          });

        } else {
          setMessage(`Running in ${context.context} context`);
        }

      } catch (error) {
        console.error('Failed to initialize Zoom SDK:', error);
        setError(`SDK initialization failed: ${error.message}`);
      }
    }

    initializeZoomSdk();
  }, [fetchEngagementContext, fetchEngagementStatus, fetchMeetingContext]);

  // Note: RTMS is automatically started/stopped based on Zoom account settings
  // No manual frontend controls needed - the backend RTMS server handles everything
  // via webhooks when Zoom sends rtms_started events (ZCC or Meeting)

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Zoom RTMS App</h1>
          <p className="subtitle">
            Real-Time Media Streams for {runningContext === 'inContactCenter' ? 'Contact Center' : runningContext === 'inMeeting' ? 'Meetings' : 'Zoom'}
          </p>
        </header>

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* RTMS Status Alert - Prominent display */}
        {(runningContext === 'inContactCenter' || runningContext === 'inMeeting') && (
          <div className={`rtms-status-alert ${rtmsStatus}`}>
            <div className="rtms-status-icon">
              {rtmsStatus === 'capturing' && '🔴'}
              {rtmsStatus === 'ready' && '🟢'}
              {rtmsStatus === 'waiting' && '⚪'}
              {rtmsStatus === 'error' && '🔴'}
            </div>
            <div className="rtms-status-text">
              {rtmsStatus === 'capturing' && (
                <>
                  <strong>RTMS ACTIVE - AUDIO BEING CAPTURED</strong>
                  <br />
                  <span className="rtms-status-detail">Real-time audio and transcripts are being recorded</span>
                </>
              )}
              {rtmsStatus === 'ready' && (
                <>
                  <strong>RTMS READY</strong>
                  <br />
                  <span className="rtms-status-detail">Waiting for {runningContext === 'inContactCenter' ? 'engagement to start' : 'meeting activity'}</span>
                </>
              )}
              {rtmsStatus === 'waiting' && (
                <>
                  <strong>RTMS INITIALIZING</strong>
                  <br />
                  <span className="rtms-status-detail">Setting up real-time media streams...</span>
                </>
              )}
              {rtmsStatus === 'error' && (
                <>
                  <strong>RTMS ERROR</strong>
                  <br />
                  <span className="rtms-status-detail">Failed to connect to RTMS server</span>
                </>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className="message-box">
            {message}
          </div>
        )}

        {zoomInitialized && (
          <div className="section">
            <h2>Status</h2>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">SDK:</span>
                <span className={`status-value ${zoomInitialized ? 'success' : 'pending'}`}>
                  {zoomInitialized ? 'Initialized' : 'Loading...'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Context:</span>
                <span className="status-value">{runningContext || 'Unknown'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">RTMS:</span>
                <span className="status-value success">
                  Auto-Enabled
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ZCC Engagement Context - Only show in Contact Center */}
        {engagementContext && runningContext === 'inContactCenter' && (
          <div className="section">
            <h2>Engagement Context</h2>
            <p><strong>Engagement ID:</strong> {engagementContext.engagementId}</p>
            <p><strong>Start Time:</strong> {new Date(engagementContext.startTime).toLocaleString()}</p>
            {engagementContext.queueName && (
              <p><strong>Queue:</strong> {engagementContext.queueName}</p>
            )}
            {engagementContext.isTransfer && (
              <p className="warning-text">This is a transferred engagement</p>
            )}

            {engagementStatus && (
              <div className="status-section">
                <h3>Engagement Status</h3>
                <p><strong>State:</strong> {engagementStatus.state}</p>
                <p><strong>Direction:</strong> {engagementStatus.direction}</p>
              </div>
            )}

            {consumerContext && (
              <div className="consumer-section">
                <h3>Consumer Information</h3>
                <p><strong>Name:</strong> {consumerContext.consumerName || 'N/A'}</p>
                <p><strong>Phone:</strong> {consumerContext.consumerPhone || 'N/A'}</p>
              </div>
            )}

            {engagementContext.consumers && engagementContext.consumers.length > 0 && (
              <div className="consumers-list">
                <h3>Consumers</h3>
                {engagementContext.consumers.map((consumer, index) => (
                  <div key={index} className="consumer-item">
                    {consumer.consumerName && <p><strong>Name:</strong> {consumer.consumerName}</p>}
                    {consumer.consumerPhone && <p><strong>Phone:</strong> {consumer.consumerPhone}</p>}
                    {consumer.consumerEmail && <p><strong>Email:</strong> {consumer.consumerEmail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meeting Context - Only show in Meeting */}
        {meetingContext && runningContext === 'inMeeting' && (
          <div className="section">
            <h2>Meeting Context</h2>
            <p><strong>Meeting ID:</strong> {meetingContext.meetingID}</p>
            <p><strong>Meeting UUID:</strong> {meetingUUID}</p>

            {userContext && (
              <div className="user-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {userContext.screenName}</p>
                <p><strong>Role:</strong> {userContext.role}</p>
                <p><strong>Participant UUID:</strong> {userContext.participantUUID}</p>
              </div>
            )}
          </div>
        )}

        {/* RTMS Information - Available for both ZCC and Meeting contexts */}
        {zoomInitialized && (runningContext === 'inContactCenter' || runningContext === 'inMeeting') && (
          <div className="section">
            <h2>RTMS Information</h2>
            <div className="rtms-info">
              <p className="info-text">
                <strong>RTMS is automatically enabled</strong> based on your Zoom account settings.
              </p>
              <h4>What gets captured automatically:</h4>
              <ul>
                <li>Live audio streams (OPUS codec, 16kHz)</li>
                <li>Real-time transcripts with timestamps</li>
                <li>Speaker identification {runningContext === 'inContactCenter' ? '(agent + consumer)' : '(meeting participants)'}</li>
                <li>{runningContext === 'inContactCenter' ? 'Engagement' : 'Meeting'} metadata</li>
              </ul>
              <p className="note">
                All data is stored on the backend RTMS server at <code>rtms/data/</code> indexed by {runningContext === 'inContactCenter' ? 'engagement' : 'meeting'} ID.
                Data is automatically saved when the {runningContext === 'inContactCenter' ? 'engagement' : 'meeting'} ends.
              </p>
              <p className="note">
                <strong>No manual controls needed</strong> - RTMS connects automatically when webhooks are received.
              </p>
            </div>
          </div>
        )}

        {/* Warning for unsupported contexts */}
        {runningContext && runningContext !== 'inContactCenter' && runningContext !== 'inMeeting' && zoomInitialized && (
          <div className="section">
            <p className="warning-text">
              This app supports Zoom Contact Center and Zoom Meetings contexts.
              Current context: {runningContext}
            </p>
          </div>
        )}

        <div className="section footer">
          <p className="footer-text">
            Zoom RTMS App | Version 1.0.0 | Supports ZCC & Meetings
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
