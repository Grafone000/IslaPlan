import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './Reveal';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let trigger: ObserverCallback;
let reducedMotion: boolean;

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        trigger = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  window.matchMedia = (() => ({ matches: reducedMotion })) as never;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const placeAt = (top: number) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ top } as DOMRect);

const wrapper = () => screen.getByText('Content').parentElement as HTMLElement;

describe('Reveal', () => {
  it('hides off-screen content until it scrolls into view', () => {
    placeAt(window.innerHeight + 500);
    render(
      <Reveal>
        <p>Content</p>
      </Reveal>,
    );
    expect(wrapper().classList.contains('reveal-hidden')).toBe(true);

    trigger([{ isIntersecting: true }]);
    expect(wrapper().classList.contains('reveal-hidden')).toBe(false);
  });

  it('leaves content already on screen alone', () => {
    placeAt(0);
    render(
      <Reveal>
        <p>Content</p>
      </Reveal>,
    );
    expect(wrapper().classList.contains('reveal-hidden')).toBe(false);
  });

  it('never hides content with reduced motion', () => {
    reducedMotion = true;
    placeAt(window.innerHeight + 500);
    render(
      <Reveal>
        <p>Content</p>
      </Reveal>,
    );
    expect(wrapper().classList.contains('reveal-hidden')).toBe(false);
  });

  it('applies the delay', () => {
    placeAt(0);
    render(
      <Reveal delayMs={150}>
        <p>Content</p>
      </Reveal>,
    );
    expect(wrapper().style.getPropertyValue('--reveal-delay')).toBe('150ms');
  });
});
