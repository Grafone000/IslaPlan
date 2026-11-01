'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

// Content is visible by default, so it still shows without JavaScript. Only what is off
// screen gets hidden, and it fades in on the way down.
export function Reveal({ delayMs = 0, children }: { delayMs?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      element.getBoundingClientRect().top < window.innerHeight
    ) {
      return;
    }

    element.classList.add('reveal-hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.classList.remove('reveal-hidden');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.classList.remove('reveal-hidden');
    };
  }, []);

  return (
    <div ref={ref} className="reveal" style={{ '--reveal-delay': `${delayMs}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
