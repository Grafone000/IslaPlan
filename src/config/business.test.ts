import { describe, expect, it } from 'vitest';
import { business } from './business';

describe('business config', () => {
  it('holds the agreed consultation and deposit values', () => {
    expect(business.contactEmail).toBe('ilaria@grafone.com');
    expect(business.contactPhoneDisplay).toBe('3519844008');
    expect(business.contactPhoneTel).toBe('+393519844008');
    expect(business.depositPercent).toBe(20);
    expect(business.currency).toBe('GBP');
  });
});
