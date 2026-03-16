import { useState, useEffect, useRef } from 'react';

/**
 * Returns debounced value. After `delay` ms of no changes, value updates.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const ref = useRef(null);
  useEffect(function () {
    ref.current = setTimeout(function () {
      setDebouncedValue(value);
    }, delay);
    return function () {
      if (ref.current) clearTimeout(ref.current);
    };
  }, [value, delay]);
  return debouncedValue;
}
