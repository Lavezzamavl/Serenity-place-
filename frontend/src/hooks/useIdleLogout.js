// frontend/src/hooks/useIdleLogout.js
import { useEffect, useRef } from 'react';

const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function useIdleLogout(onIdle, enabled = true) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, IDLE_LIMIT_MS);
    };
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, reset));
    reset();

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, reset));
    };
  }, [onIdle, enabled]);
}