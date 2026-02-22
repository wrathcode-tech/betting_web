import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 1) Scrolls window to top whenever the route changes.
 * 2) Shows a themed "scroll to top" button when user has scrolled down.
 * Use inside Router so useLocation works.
 */
const SCROLL_SHOW_THRESHOLD = 300;

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [showButton, setShowButton] = useState(false);

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Show button on any page that has scroll, when user has scrolled down; hide when full page fits on screen
  useEffect(() => {
    const updateVisibility = () => {
      const scrollY = window.scrollY;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0
      );
      const viewportHeight = window.innerHeight;
      const hasScroll = docHeight > viewportHeight + 5;
      setShowButton(hasScroll && scrollY > SCROLL_SHOW_THRESHOLD);
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('load', updateVisibility);

    const resizeObserver = new ResizeObserver(updateVisibility);
    resizeObserver.observe(document.body);
    try {
      if (document.documentElement) resizeObserver.observe(document.documentElement);
    } catch (_) {}

    updateVisibility();
    requestAnimationFrame(updateVisibility);
    const t1 = setTimeout(updateVisibility, 100);
    const t2 = setTimeout(updateVisibility, 400);
    const t3 = setTimeout(updateVisibility, 800);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('load', updateVisibility);
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {showButton && (
        <button
          type="button"
          className="scroll_to_top_btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  );
}
