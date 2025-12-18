import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './AIAssistant.css';

// Keyword rules for detecting prompts
const KEYWORD_RULES = [
  {
    keywords: ['manager', 'supervisor', 'escalate', 'speak to manager'],
    prompt: 'Based on the manager reference, consider escalating this call',
    priority: 'high',
    icon: '🔼'
  },
  {
    keywords: ['refund', 'money back', 'return'],
    prompt: 'Customer is requesting a refund - check refund policy',
    priority: 'medium',
    icon: '💰'
  },
  {
    keywords: ['cancel', 'cancellation', 'close account'],
    prompt: 'Customer wants to cancel - consider retention offers',
    priority: 'high',
    icon: '⚠️'
  },
  {
    keywords: ['angry', 'frustrated', 'upset', 'disappointed'],
    prompt: 'Customer showing frustration - use empathy statements',
    priority: 'medium',
    icon: '😟'
  },
  {
    keywords: ['competitor', 'other company', 'switching'],
    prompt: 'Customer mentioned competitor - highlight your strengths',
    priority: 'medium',
    icon: '🏆'
  },
  {
    keywords: ['technical issue', 'not working', 'broken', 'error'],
    prompt: 'Technical issue detected - consider technical support transfer',
    priority: 'medium',
    icon: '🔧'
  }
];

const AIAssistant = ({ isCapturing, simulatedTranscripts = [] }) => {
  const [prompts, setPrompts] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Analyze transcript for keywords
  const analyzeTranscript = (text, speaker) => {
    const lowerText = text.toLowerCase();
    const newPrompts = [];

    for (const rule of KEYWORD_RULES) {
      for (const keyword of rule.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          newPrompts.push({
            id: Date.now() + Math.random(),
            keyword,
            prompt: rule.prompt,
            priority: rule.priority,
            icon: rule.icon,
            speaker: speaker || 'Customer',
            timestamp: new Date().toISOString()
          });
          break; // Only trigger once per rule
        }
      }
    }

    return newPrompts;
  };

  // Connect to WebSocket for real-time transcripts
  useEffect(() => {
    // When running in production/Zoom app, connect to the current origin
    // When in development, connect to backend directly
    const backendUrl = window.location.origin.includes('localhost:3000')
      ? 'http://localhost:3001'
      : window.location.origin;

    console.log('🔌 Connecting to WebSocket at:', backendUrl);

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    });

    newSocket.on('connect', () => {
      console.log('✅ AI Assistant connected to backend WebSocket');
      console.log('   Socket ID:', newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('transcript-data', (transcript) => {
      console.log('📝 Transcript received in AIAssistant:', transcript);

      // Analyze the transcript for keywords
      const detectedPrompts = analyzeTranscript(transcript.text, transcript.speaker);

      if (detectedPrompts.length > 0) {
        console.log('🎯 Keywords detected! Adding prompts:', detectedPrompts);
        setPrompts(prev => [...detectedPrompts, ...prev].slice(0, 10)); // Keep last 10
      } else {
        console.log('   No keywords found in:', transcript.text);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ AI Assistant disconnected from backend WebSocket');
      setConnectionStatus('disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Process simulated transcripts (for testing)
  useEffect(() => {
    if (simulatedTranscripts.length > 0) {
      const latestTranscript = simulatedTranscripts[simulatedTranscripts.length - 1];
      const detectedPrompts = analyzeTranscript(latestTranscript.text, latestTranscript.speaker);

      if (detectedPrompts.length > 0) {
        setPrompts(prev => [...detectedPrompts, ...prev].slice(0, 10)); // Keep last 10
      }
    }
  }, [simulatedTranscripts]);

  // Handle manual transcript input for testing
  const handleTranscriptSubmit = (e) => {
    e.preventDefault();
    if (!currentTranscript.trim()) return;

    const detectedPrompts = analyzeTranscript(currentTranscript, 'Customer');

    if (detectedPrompts.length > 0) {
      setPrompts(prev => [...detectedPrompts, ...prev].slice(0, 10));
    }

    setCurrentTranscript('');
  };

  const clearPrompts = () => {
    setPrompts([]);
  };

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <h2>💡 AI Assistant</h2>
        <p className="ai-assistant-subtitle">
          Real-time suggestions based on conversation keywords
        </p>
      </div>

      {/* Test Input for Demo */}
      <div className="ai-test-section">
        <form onSubmit={handleTranscriptSubmit} className="ai-test-form">
          <input
            type="text"
            value={currentTranscript}
            onChange={(e) => setCurrentTranscript(e.target.value)}
            placeholder="Type a sentence with keywords like 'manager', 'refund', 'cancel'..."
            className="ai-test-input"
          />
          <button type="submit" className="ai-test-button">
            Test Keyword Detection
          </button>
        </form>
        <p className="ai-test-hint">
          Try typing: "I want to speak to a manager" or "I need a refund"
        </p>
      </div>

      {/* Prompts Display */}
      {prompts.length > 0 ? (
        <div className="ai-prompts-container">
          <div className="ai-prompts-header">
            <span className="ai-prompts-count">{prompts.length} Active Prompts</span>
            <button onClick={clearPrompts} className="ai-clear-button">
              Clear All
            </button>
          </div>

          <div className="ai-prompts-list">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`ai-prompt-card priority-${prompt.priority}`}
              >
                <div className="ai-prompt-icon">{prompt.icon}</div>
                <div className="ai-prompt-content">
                  <div className="ai-prompt-header">
                    <span className={`ai-prompt-badge badge-${prompt.priority}`}>
                      {prompt.priority === 'high' ? 'HIGH PRIORITY' : 'ATTENTION'}
                    </span>
                    <span className="ai-prompt-time">
                      {new Date(prompt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="ai-prompt-message">{prompt.prompt}</div>
                  <div className="ai-prompt-footer">
                    <span className="ai-prompt-keyword">
                      Detected: <strong>"{prompt.keyword}"</strong>
                    </span>
                    <span className="ai-prompt-speaker">by {prompt.speaker}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">🎧</div>
          <p className="ai-empty-text">
            {isCapturing
              ? 'Listening for keywords in the conversation...'
              : 'No prompts detected yet. Start a conversation or use the test input above.'}
          </p>
          <div className="ai-keywords-list">
            <p className="ai-keywords-title">Monitoring for keywords:</p>
            <div className="ai-keywords-grid">
              {KEYWORD_RULES.map((rule, index) => (
                <span key={index} className="ai-keyword-tag">
                  {rule.icon} {rule.keywords[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
