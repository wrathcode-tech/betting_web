import React from 'react';
import './Pagination.css';

/**
 * Pagination: Previous / Next, current page, total pages.
 * onPageChange(page) when user clicks Prev/Next.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  className = '',
}) {
  const canPrev = currentPage > 1 && !loading;
  const canNext = currentPage < totalPages && !loading;

  const handlePrev = () => {
    if (canPrev) onPageChange?.(currentPage - 1);
  };

  const handleNext = () => {
    if (canNext) onPageChange?.(currentPage + 1);
  };

  return (
    <div className={'history_pagination ' + (className || '')} role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="history_pagination_btn"
        onClick={handlePrev}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        Previous
      </button>
      <span className="history_pagination_info" aria-live="polite">
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        className="history_pagination_btn"
        onClick={handleNext}
        disabled={!canNext}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
