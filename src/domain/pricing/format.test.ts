import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

describe('formatMoney', () => {
  it('shows whole pounds without decimals', () => {
    expect(formatMoney(336_000)).toBe('£3,360');
  });

  it('shows pence when there are any', () => {
    expect(formatMoney(123_650)).toBe('£1,236.50');
  });
});
