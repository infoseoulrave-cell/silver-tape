'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** 'up' | 'scale' */
  variant?: 'up' | 'scale';
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'none'
      : variant === 'scale'
        ? 'scale(0.96) translateY(20px)'
        : 'translateY(30px)',
    transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };

  return (
    <div ref={ref} className={className} style={baseStyle}>
      {children}
    </div>
  );
}
