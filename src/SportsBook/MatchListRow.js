/**
 * Memoized match row shell — re-renders only when props change.
 * Pass stable callbacks from parent (useCallback).
 */
import React, { memo } from 'react';
import { getMarketPillsFromSources, getMatchStreamVisible } from '../utils/matchMarketPills';

/**
 * @param {{
 *   rowKey: string,
 *   icon?: string,
 *   tournament?: string,
 *   teams?: string,
 *   timeLabel?: string,
 *   live?: boolean,
 *   onRowClick?: (e: import('react').MouseEvent) => void,
 *   children?: import('react').ReactNode,
 *   oddsPayload?: Record<string, unknown> | null,
 *   marketPills?: string[] | null,
 *   matchSource?: Record<string, unknown> | null,
 * }} props
 */
export const MatchListRow = memo(function MatchListRow({
  rowKey,
  icon,
  tournament,
  teams,
  timeLabel,
  live,
  onRowClick,
  children,
  oddsPayload = null,
  marketPills: marketPillsProp = null,
  matchSource = null,
}) {
  const pills =
    marketPillsProp != null && Array.isArray(marketPillsProp)
      ? marketPillsProp
      : getMarketPillsFromSources(matchSource ?? {}, oddsPayload);
  const showStream = getMatchStreamVisible(matchSource ?? {});
  return (
    <div
      key={rowKey}
      className="match_slider"
      onClick={onRowClick}
      style={{ display: 'block', cursor: onRowClick ? 'pointer' : 'default' }}
      role={onRowClick ? 'button' : undefined}
    >
      <div className="match_slider_inner">
        <div className="matchtp_hd d-flex justify-content-between align-items-center gap-2">
          <div className="hd_match d-flex align-items-center gap-2">
            {icon ? <img src={icon} alt="" loading="lazy" decoding="async" /> : null}
            {showStream ? (
              <i className="ri-play-circle-line" style={{ fontSize: '1.1rem', opacity: 0.9 }} aria-hidden />
            ) : null}
            <h3>Match</h3>
            {live ? (
              <span
                className="match_live_badge"
                style={{
                  background: '#e53935',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Live
              </span>
            ) : null}
          </div>
          {pills.length > 0 ? (
            <ul>
              {pills.map((pill, pi) => (
                <li key={`${pill}-${pi}`}>{pill}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {tournament ? <p>{tournament}</p> : null}
        <div className="match_info">
          {teams ? <p className="match_team">{teams}</p> : null}
          <span>{live ? 'Live' : timeLabel}</span>
        </div>
        {children}
      </div>
    </div>
  );
});

export default MatchListRow;
