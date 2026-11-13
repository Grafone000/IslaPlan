'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export type HomeSlide = { id: string; label: string; content: ReactNode };

const FORWARD_KEYS = new Set(['ArrowDown', 'PageDown', ' ']);
const BACK_KEYS = new Set(['ArrowUp', 'PageUp']);
const KEEP_KEYS = 'input, textarea, select, button, [contenteditable="true"], [role="dialog"]';

// The Home is one screen at a time, in the manner of a fashion lookbook. Every slide fills
// the screen and stays in place while the next one slides over it; on the way out it
// shrinks towards the centre, leaving a white frame. Scroll snapping stops on each slide.
export function HomeSlides({ slides }: { slides: readonly HomeSlide[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const items = Array.from(scroller.querySelectorAll<HTMLElement>('[data-slide]'));
    let frame = 0;
    let targetIndex: number | null = null;
    let settle = 0;

    // --leave runs from 0, the slide fills the screen, to 1, the next one covers it.
    const update = () => {
      frame = 0;
      const height = scroller.clientHeight || 1;
      items.forEach((item, index) => {
        const leave = Math.min(1, Math.max(0, (scroller.scrollTop - index * height) / height));
        item.style.setProperty('--leave', leave.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      // Once scrolling stops, the next key press counts from where the page came to rest.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => (targetIndex = null), 150);
    };

    // The document itself does not scroll, so page keys move from slide to slide. Fields,
    // buttons (Space presses them) and the open menu keep their own keys.
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target.closest(KEEP_KEYS)
      ) {
        return;
      }
      let step = 0;
      if (FORWARD_KEYS.has(event.key)) step = event.shiftKey && event.key === ' ' ? -1 : 1;
      else if (BACK_KEYS.has(event.key)) step = -1;
      if (!step) return;
      event.preventDefault();
      // Count from the slide already on its way in, so quick presses each move one slide.
      const height = scroller.clientHeight || 1;
      targetIndex = Math.min(
        items.length - 1,
        Math.max(0, (targetIndex ?? Math.round(scroller.scrollTop / height)) + step),
      );
      scroller.scrollTo({ top: targetIndex * height });
    };

    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('keydown', onKey);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <div ref={scrollerRef} data-home-scroller className="home-scroller">
      <div className="relative">
        {slides.map((slide, index) => (
          // Anchors and snap points sit outside the sticky slides, so links always land
          // on the right screen, whatever is stacked above it.
          <span
            key={`${slide.id}-anchor`}
            id={slide.id}
            aria-hidden="true"
            className="home-snap"
            style={{ top: `calc(${index} * var(--home-slide-height))` }}
          />
        ))}
        {slides.map((slide) => (
          <section key={slide.id} data-slide aria-label={slide.label} className="home-slide">
            <div className="home-slide-inner">{slide.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
