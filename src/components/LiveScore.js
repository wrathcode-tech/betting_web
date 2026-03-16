import React from 'react';
import { useScoreboard } from '../context/SportsbookStore';
import './LiveScore.css';

export default function LiveScore({ gameId, className = '', fallback = null }) {
  const payload = useScoreboard(gameId);
  const score = payload?.score ?? payload?.data?.score ?? payload?.liveScore ?? payload?.data?.liveScore;

  if (score == null || score === '') {
    return fallback ? <span className={'live_score_placeholder ' + (className || '')}>{fallback}</span> : null;
  }

  return (
    <div className={'live_score_root ' + (className || '')} aria-live="polite">
      <span className="live_score_label">Live</span>
      <span className="live_score_value">{typeof score === 'object' ? JSON.stringify(score) : String(score)}</span>
    </div>
  );
}
