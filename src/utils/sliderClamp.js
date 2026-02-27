/**
 * Clamp horizontal translate so slider stops at first/last item (no gap, no overscroll).
 * Used by Landing, Search, and any transform-based card sliders.
 * @param {HTMLElement} el - The inner slider element (has transform)
 * @param {number} translateX - Desired translateX in px (usually negative when scrolling right)
 * @returns {number} Clamped translateX
 */
export function clampSliderTranslate(el, translateX) {
  if (!el?.parentElement) return translateX;
  const contentWidth = el.offsetWidth;
  const containerWidth = el.parentElement.clientWidth;
  const maxTranslate = contentWidth <= containerWidth ? 0 : -(contentWidth - containerWidth);
  return Math.max(maxTranslate, Math.min(0, translateX));
}
