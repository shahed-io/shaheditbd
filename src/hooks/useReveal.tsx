import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  /** ms to force-show if observer hasn't fired yet (default: 600) */
  fallbackMs?: number;
}

export const useReveal = (options: UseRevealOptions = {}) => {
  const {
    threshold = 0.05,
    rootMargin = '0px 0px -40px 0px',
    once = true,
    fallbackMs = 600,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;

    // Fallback: force visible after fallbackMs in case observer doesn't fire
    const fallback = setTimeout(() => setVisible(true), fallbackMs);

    if (!el) {
      return () => clearTimeout(fallback);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, fallbackMs]);

  return { ref, visible };
};
