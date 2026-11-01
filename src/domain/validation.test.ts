import { describe, expect, it } from 'vitest';
import {
  isCompleteEvent,
  isContact,
  isEmail,
  isPhone,
  isUuid,
  safeNextPath,
} from './validation';

const event = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: [], activitiesPreference: null },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: '2500-5000',
};

const contact = {
  firstName: 'Jamie',
  lastName: 'Doe',
  email: 'jamie@example.com',
  phone: '+44 7700 900000',
};

describe('isCompleteEvent', () => {
  it('accepts a finished event', () => {
    expect(isCompleteEvent(event)).toBe(true);
  });

  it('accepts an end time after midnight', () => {
    expect(isCompleteEvent({ ...event, endTime: '01:30', endsNextDay: true })).toBe(true);
  });

  it.each([
    ['unknown event type', { type: 'funeral' }],
    ['missing date', { date: null }],
    ['impossible date', { date: '2027-02-30' }],
    ['end before start', { endTime: '18:00' }],
    ['end equal to start', { endTime: '18:30' }],
    ['end after 02:00 next day', { endTime: '03:00', endsNextDay: true }],
    ['bad time format', { startTime: '25:00' }],
    ['no food', { food: [] }],
    ['no drinks', { drinks: [] }],
    ['unknown food', { food: ['pizza'] }],
    ['duplicate food', { food: ['dinner', 'dinner'] }],
    ['excluded food pair', { food: ['private-chef', 'dinner'] }],
    ['excluded drinks pair', { drinks: ['wine-only', 'byo-drinks'] }],
    ['unknown budget', { budget: 'free' }],
    ['note too long', { additionalInfo: 'x'.repeat(2001) }],
  ])('rejects %s', (_name, change) => {
    expect(isCompleteEvent({ ...event, ...change })).toBe(false);
  });

  it('rejects something that is not an object', () => {
    expect(isCompleteEvent(null)).toBe(false);
    expect(isCompleteEvent([])).toBe(false);
  });
});

describe('isContact', () => {
  it('accepts full contact details', () => {
    expect(isContact(contact)).toBe(true);
  });

  it.each([
    ['blank first name', { firstName: '  ' }],
    ['blank last name', { lastName: '' }],
    ['bad email', { email: 'jamie' }],
    ['bad phone', { phone: 'call me' }],
  ])('rejects %s', (_name, change) => {
    expect(isContact({ ...contact, ...change })).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('keeps same-site paths', () => {
    expect(safeNextPath('/plan/contact')).toBe('/plan/contact');
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['https://evil.example'],
    ['//evil.example'],
    ['/\\evil.example'],
  ])('falls back to the Home for %j', (value) => {
    expect(safeNextPath(value)).toBe('/');
  });
});

describe('field checks', () => {
  it('checks uuids', () => {
    expect(isUuid('6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11')).toBe(true);
    expect(isUuid('nope')).toBe(false);
    expect(isUuid(1)).toBe(false);
  });

  it('checks emails and phones', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isPhone('3519844008')).toBe(true);
    expect(isPhone('123')).toBe(false);
  });
});
