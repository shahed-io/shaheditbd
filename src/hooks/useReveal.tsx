import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export const useReveal = (options: UseRevealOptions = {}) => {
  const { threshold = 0.12, rootMargin = '0px 0px -60px 0px', once = true } = options;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible };
};
