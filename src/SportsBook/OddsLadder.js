/**
 * Memoized 3-column odds strip (back / lay per column).
 * Missing odds → locked UI (not zero).
 */
import React, { memo, useMemo } from 'react';

const defaultFormatSize = (size) => {
  if (size == null || size === '') return '';
  const n = Number(size);
  if (!Number.isFinite(n)) return String(size);
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
};

function isValidOdds(val) {
  if (val == null || val === '') return false;
  const n = parseFloat(String(val).trim());
  return !Number.isNaN(n) && n > 0;
}

/**
 * @param {{
 *   columns?: Array<{ back?: any, lay?: any, sizeBack?: any, sizeLay?: any } | null>,
 *   formatSize?: (v: any) => string,
 *   onBackClick?: (colIndex: number, e: import('react').MouseEvent) => void,
 *   onLayClick?: (colIndex: number, e: import('react').MouseEvent) => void,
 *   classNamePrefix?: string,
 * }} props
 */
export const OddsLadder = memo(function OddsLadder({
  columns = [],
  formatSize = defaultFormatSize,
  onBackClick,
  onLayClick,
  classNamePrefix = 'odds_ladder',
}) {
  const triple = useMemo(() => {
    const src = Array.isArray(columns) ? columns.slice(0, 3) : [];
    while (src.length < 3) src.push(null);
    return src.map((col, idx) => {
      if (!col) {
        return { key: `lock-${idx}`, locked: true };
      }
      const backOk = isValidOdds(col.back);
      const layOk = isValidOdds(col.lay);
      return {
        key: `col-${idx}`,
        locked: false,
        back: backOk ? col.back : null,
        lay: layOk ? col.lay : null,
        sizeBack: backOk ? formatSize(col.sizeBack ?? col.bs1) : '',
        sizeLay: layOk ? formatSize(col.sizeLay ?? col.ls1) : '',
      };
    });
  }, [columns, formatSize]);

  return (
    <div className={`${classNamePrefix}_row d-flex justify-content-between align-items-center gap-2`}>
      {triple.map((c, idx) =>
        c.locked ? (
          <div key={c.key} className={`${classNamePrefix}_pair view_matchlike`}>
            <button type="button" className="view_match disabled" disabled aria-hidden>
              <i className="ri-lock-line" aria-hidden />
            </button>
            <button type="button" className="like_match disabled" disabled aria-hidden>
              <i className="ri-lock-line" aria-hidden />
            </button>
          </div>
        ) : (
          <div key={c.key} className={`${classNamePrefix}_pair view_matchlike`}>
            <button
              type="button"
              className="view_match"
              disabled={c.back == null}
              onClick={onBackClick ? (e) => onBackClick(idx, e) : undefined}
            >
              {c.back != null ? c.back : '—'}{' '}
              <span>{c.back != null && c.sizeBack ? c.sizeBack : '—'}</span>
            </button>
            <button
              type="button"
              className="like_match"
              disabled={c.lay == null}
              onClick={onLayClick ? (e) => onLayClick(idx, e) : undefined}
            >
              {c.lay != null ? c.lay : '—'}{' '}
              <span>{c.lay != null && c.sizeLay ? c.sizeLay : '—'}</span>
            </button>
          </div>
        )
      )}
    </div>
  );
});

export default OddsLadder;
