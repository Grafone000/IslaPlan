'use client';

import { useEffect, useRef } from 'react';

// The big name on the first photo fades away as the page scrolls.
export function HeroName({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const fadeDistance = window.innerHeight * 0.5;
      element.style.opacity = String(Math.max(0, 1 - window.scrollY / fadeDistance));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <h1
      ref={ref}
      className="m-0 font-display text-[clamp(72px,17vw,280px)] leading-[0.85] font-normal tracking-[-0.03em] transition-opacity duration-100 ease-out"
    >
      {name}
    </h1>
  );
}
