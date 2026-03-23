import { useEffect, useRef, useState } from 'react';

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'blur';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  variant?: RevealVariant;
  delay?: number;
}

export const useReveal = (options: UseRevealOptions = {}) => {
  const {
    threshold = 0.08,
    rootMargin = '0px 0px -40px 0px',
    once = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: reveal after 600ms even if IO doesn't fire (low-end mobile)
    const fallback = setTimeout(() => setVisible(true), 600);

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
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, rootMargin, once]);

  return { ref, visible };
};

/** Returns inline style object for reveal animation */
export const getRevealStyle = (
  visible: boolean,
  variant: RevealVariant = 'up',
  delay: number = 0,
  duration: number = 0.65
): React.CSSProperties => {
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const transition = `opacity ${duration}s ${easing} ${delay}s, transform ${duration}s ${easing} ${delay}s, filter ${duration}s ${easing} ${delay}s`;

  const hiddenMap: Record<RevealVariant, React.CSSProperties> = {
    up:    { opacity: 0, transform: 'translateY(36px) scale(0.98)', filter: 'blur(4px)' },
    down:  { opacity: 0, transform: 'translateY(-36px) scale(0.98)', filter: 'blur(4px)' },
    left:  { opacity: 0, transform: 'translateX(-40px)', filter: 'blur(3px)' },
    right: { opacity: 0, transform: 'translateX(40px)', filter: 'blur(3px)' },
    scale: { opacity: 0, transform: 'scale(0.85)', filter: 'blur(6px)' },
    fade:  { opacity: 0, filter: 'blur(8px)' },
    blur:  { opacity: 0, filter: 'blur(12px)', transform: 'scale(0.97)' },
  };

  const visibleStyle: React.CSSProperties = {
    opacity: 1,
    transform: 'translateY(0) translateX(0) scale(1)',
    filter: 'blur(0px)',
  };

  return {
    transition,
    willChange: 'transform, opacity, filter',
    ...(visible ? visibleStyle : hiddenMap[variant]),
  };
};
