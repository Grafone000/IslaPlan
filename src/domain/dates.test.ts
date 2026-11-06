import { describe, expect, it } from 'vitest';
import { guestsText } from './catalog';
import { earliestEventDate, formatEventDate, formatShortDate } from './dates';

describe('earliestEventDate', () => {
  it('is one month from today', () => {
    expect(earliestEventDate(new Date(2026, 10, 6))).toBe('2026-12-06');
    expect(earliestEventDate(new Date(2027, 0, 31))).toBe('2027-02-28');
  });
});

describe('formatEventDate', () => {
  it('uses the long British form', () => {
    expect(formatEventDate('2027-05-14')).toBe('14 May 2027');
    expect(formatEventDate('2030-06-01')).toBe('1 June 2030');
  });

  it('gives an empty string without a date', () => {
    expect(formatEventDate(null)).toBe('');
  });
});

describe('formatShortDate', () => {
  it('shortens a timestamp to its day', () => {
    expect(formatShortDate('2026-11-02T10:15:00')).toBe('2 Nov 2026');
  });
});

describe('guestsText', () => {
  it('reads naturally inside a sentence', () => {
    expect(guestsText('size-40-60')).toBe('40 to 60 guests');
    expect(guestsText('size-up-to-100')).toBe('up to 100 guests');
  });
});
