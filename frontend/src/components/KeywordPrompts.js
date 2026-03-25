import { useState, useEffect } from 'react';
import './KeywordPrompts.css';

const KEYWORDS = {
  'refund':      { prompt: 'Check refund eligibility and initiate if applicable',           category: 'billing' },
  'cancel':      { prompt: 'Present retention offer before processing cancellation',        category: 'retention' },
  'supervisor':  { prompt: 'Escalation requested — notify supervisor to stand by',          category: 'escalation' },
  'manager':     { prompt: 'Escalation requested — notify manager to stand by',             category: 'escalation' },
  'billing':     { prompt: 'Verify billing account and pull up recent charges',             category: 'billing' },
  'complaint':   { prompt: 'Log complaint in CRM and acknowledge the issue',                category: 'service' },
  'angry':       { prompt: 'De-escalate: acknowledge feelings, empathize, offer solution',  category: 'de-escalation' },
  'frustrated':  { prompt: 'De-escalate: acknowledge feelings, empathize, offer solution',  category: 'de-escalation' },
  'upset':       { prompt: 'De-escalate: acknowledge feelings, empathize, offer solution',  category: 'de-escalation' },
  'password':    { prompt: 'Guide customer through self-service password reset flow',       category: 'tech' },
  'not working': { prompt: 'Initiate troubleshooting flow and document the issue in CRM',  category: 'tech' },
  'broken':      { prompt: 'Initiate troubleshooting flow and document the issue in CRM',  category: 'tech' },
  'account':     { prompt: 'Verify customer identity and pull up account details',          category: 'account' },
  'hold':        { prompt: 'Keep hold under 2 minutes — update customer when resuming',    category: 'hold' },
  'wait':        { prompt: 'Acknowledge wait time and set clear expectations',              category: 'hold' },
};

const CATEGORY_LABELS = {
  billing:          'Billing',
  retention:        'Retention',
  escalation:       'Escalation',
  service:          'Service',
  'de-escalation':  'De-escalate',
  tech:             'Tech Support',
  account:          'Account',
  hold:             'Hold',
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';

function KeywordPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${BACKEND_URL}/rtms-events`);

    es.addEventListener('connected', () => setConnected(true));
    es.onerror = () => setConnected(false);

    es.addEventListener('transcript', (e) => {
      const { text } = JSON.parse(e.data);
      const lower = text.toLowerCase();

      Object.entries(KEYWORDS).forEach(([keyword, { prompt, category }]) => {
        if (!lower.includes(keyword)) return;

        setPrompts(prev => {
          // suppress the same keyword within 10 seconds
          const recent = prev.some(
            p => p.keyword === keyword &&
            Date.now() - new Date(p.timestamp).getTime() < 10000
          );
          if (recent) return prev;

          const card = { keyword, prompt, category, transcript: text, timestamp: new Date().toISOString(), id: `${keyword}-${Date.now()}` };
          return [card, ...prev].slice(0, 10);
        });
      });
    });

    return () => es.close();
  }, []);

  return (
    <div className="keyword-prompts-container">
      <div className="keyword-prompts-header">
        <div className="keyword-prompts-title">
          <span className="keyword-prompts-icon">AI</span>
          <h2>Live Agent Prompts</h2>
        </div>
        <div className="keyword-prompts-meta">
          <span className={`kp-connection-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className="kp-connection-label">{connected ? 'Live' : 'Connecting…'}</span>
          {prompts.length > 1 && (
            <button className="kp-dismiss-all" onClick={() => setPrompts([])}>Clear all</button>
          )}
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="kp-empty">
          <p>Listening for keywords in the conversation…</p>
          <p className="kp-empty-hint">Prompts will appear here when trigger words are detected.</p>
        </div>
      ) : (
        <ul className="kp-list">
          {prompts.map(p => (
            <li key={p.id} className={`kp-card kp-card--${p.category}`}>
              <div className="kp-card-top">
                <span className={`kp-badge kp-badge--${p.category}`}>
                  {CATEGORY_LABELS[p.category] || p.category}
                </span>
                <span className="kp-keyword">"{p.keyword}"</span>
                <button className="kp-dismiss" onClick={() => setPrompts(prev => prev.filter(x => x.id !== p.id))} aria-label="Dismiss">×</button>
              </div>
              <p className="kp-prompt">{p.prompt}</p>
              {p.transcript && <p className="kp-transcript"><em>"{p.transcript}"</em></p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default KeywordPrompts;
