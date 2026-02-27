import { useRef, useEffect } from 'react';
import { clampSliderTranslate } from '../utils/sliderClamp';

/**
 * Shared drag-to-scroll for transform-based sliders (Landing, Search).
 * Returns handlers to attach to the wrapper; config is passed per slider in onMouseDown.
 */
export function useSliderDrag() {
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startTranslate: 0,
    lastTranslate: 0,
    sliderEl: null,
    getItemWidth: null,
    itemsPerSet: 0,
    setIndex: () => {},
  });
  const justDraggedRef = useRef(false);

  const handleMouseDown = (e, config) => {
    if (e.button !== 0 || !config.sliderRef?.current) return;
    e.preventDefault();
    const itemWidth = typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth;
    const startTranslate = -config.currentIndex * itemWidth;
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startTranslate,
      lastTranslate: startTranslate,
      sliderEl: config.sliderRef.current,
      getItemWidth: config.getItemWidth,
      itemsPerSet: config.itemsPerSet,
      setIndex: config.setIndex,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleClickCapture = (e) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      const d = dragStateRef.current;
      if (!d.isDragging || !d.sliderEl) return;
      const deltaX = e.clientX - d.startX;
      let newTranslate = d.startTranslate - deltaX;
      newTranslate = clampSliderTranslate(d.sliderEl, newTranslate);
      d.sliderEl.style.transition = 'none';
      d.sliderEl.style.transform = `translateX(${newTranslate}px)`;
      d.lastTranslate = newTranslate;
    };
    const onMouseUp = () => {
      const d = dragStateRef.current;
      if (!d.isDragging || !d.sliderEl) return;
      const moved = Math.abs(d.lastTranslate - d.startTranslate) > 5;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      d.isDragging = false;
      if (moved) justDraggedRef.current = true;
      const clampedTranslate = clampSliderTranslate(d.sliderEl, d.lastTranslate);
      d.sliderEl.style.transform = `translateX(${clampedTranslate}px)`;
      d.sliderEl.style.transition = '';
      const itemWidth = typeof d.getItemWidth === 'function' ? d.getItemWidth() : d.getItemWidth;
      let nearestIndex = Math.round(-clampedTranslate / itemWidth);
      if (nearestIndex < 0) nearestIndex = 0;
      if (nearestIndex >= d.itemsPerSet) nearestIndex = d.itemsPerSet - 1;
      d.setIndex(nearestIndex);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return { handleMouseDown, handleClickCapture };
}
