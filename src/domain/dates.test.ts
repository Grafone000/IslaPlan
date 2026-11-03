import { describe, expect, it } from 'vitest';
import { guestsText } from './catalog';
import { formatEventDate, formatShortDate } from './dates';

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
    expect(guestsText(50)).toBe('50 guests');
    expect(guestsText(1)).toBe('1 guest');
  });
});
