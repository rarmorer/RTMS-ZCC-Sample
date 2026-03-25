import { useState, useEffect } from 'react';
import './SentimentIndicator.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';

function SentimentIndicator() {
  const [level, setLevel] = useState('normal'); // 'normal' | 'high'

  useEffect(() => {
    const es = new EventSource(`${BACKEND_URL}/rtms-events`);

    es.addEventListener('sentiment', (e) => {
      const { level } = JSON.parse(e.data);
      setLevel(level);
    });

    return () => es.close();
  }, []);

  return (
    <div className={`sentiment-banner sentiment-banner--${level}`}>
      <span className="sentiment-icon">{level === 'high' ? '⚠' : '✓'}</span>
      <span className="sentiment-text">
        {level === 'high'
          ? <><strong>Elevated volume detected</strong> — customer may be frustrated. Use de-escalation techniques.</>
          : <><strong>Volume normal</strong> — conversation tone is calm.</>
        }
      </span>
    </div>
  );
}

export default SentimentIndicator;
