import { useState, useEffect } from 'react';
import './AIAssistSearch.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';

const KEYWORD_LIST = [
  'refund', 'cancel', 'supervisor', 'manager', 'billing', 'complaint',
  'angry', 'frustrated', 'upset', 'password', 'not working', 'broken',
  'account', 'hold', 'wait',
];

const MOCK_FALLBACK_TERMS = [
  'billing dispute refund account credit resolution',
  'service cancellation retention offer loyalty discount',
  'technical issue troubleshooting account access reset',
  'escalation supervisor customer complaint resolution steps',
];

function buildSearchTerm(keywords) {
  if (keywords.length === 0) {
    return MOCK_FALLBACK_TERMS[Math.floor(Math.random() * MOCK_FALLBACK_TERMS.length)];
  }
  return [...new Set(keywords)].slice(0, 6).join(' ');
}

function AIAssistSearch() {
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [searchTerm, setSearchTerm] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${BACKEND_URL}/rtms-events`);

    es.addEventListener('transcript', (e) => {
      const { text } = JSON.parse(e.data);
      const lower = text.toLowerCase();
      KEYWORD_LIST.forEach(kw => {
        if (lower.includes(kw)) {
          setDetectedKeywords(prev =>
            prev.includes(kw) ? prev : [...prev, kw]
          );
        }
      });
    });

    return () => es.close();
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setSearchTerm(null);
    setCopied(false);
    setTimeout(() => {
      setSearchTerm(buildSearchTerm(detectedKeywords));
      setIsGenerating(false);
    }, 750);
  };

  const handleCopy = () => {
    if (!searchTerm) return;
    navigator.clipboard.writeText(searchTerm).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="aas-container">
      <button
        className={`aas-btn${isGenerating ? ' aas-btn--loading' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="aas-spinner" />
            Generating…
          </>
        ) : (
          <>
            <span className="aas-btn-icon">✦</span>
            Create AI Assist Search Term
          </>
        )}
      </button>
      <p className="aas-subtext">
        Use this feature to extract key words from your conversation to create a search term to paste into AI Assist
      </p>

      {searchTerm && (
        <div className="aas-result">
          <span className="aas-term">Help setting up new account</span>
          <button
            className={`aas-copy-btn${copied ? ' aas-copy-btn--copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5V10.5A1.5 1.5 0 0 0 3.5 12H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default AIAssistSearch;
