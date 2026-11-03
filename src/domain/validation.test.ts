import { describe, expect, it } from 'vitest';
import {
  isCompleteEvent,
  isContact,
  isEmail,
  isPhone,
  isUuid,
  safeNextPath,
} from './validation';

const slot = (startTime: string, endTime: string) => ({
  startTime,
  startsNextDay: false,
  endTime,
  endsNextDay: false,
});

const event = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  guests: 50,
  food: { items: ['dinner'], menus: {}, ownFoodNote: null },
  drinks: {
    items: ['wine-only'],
    packages: { 'wine-only': 'wine-175ml' },
    times: {},
    ownDrinksNote: null,
  },
  entertainment: { items: [], times: {}, activitiesPreference: null },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: 500_000,
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

  it('accepts menus, packages, service times and notes', () => {
    expect(
      isCompleteEvent({
        ...event,
        food: { items: ['brunch', 'own-food'], menus: { brunch: 'maple-and-rye' }, ownFoodNote: 'Cake' },
        drinks: {
          items: ['wine-only', 'cocktails-spirits-only', 'private-sommelier'],
          packages: {
            'wine-only': 'prosecco-champagne-6-glasses',
            'cocktails-spirits-only': 'two-cocktails-or-half-bottle',
          },
          times: { 'private-sommelier': slot('19:00', '21:00') },
          ownDrinksNote: null,
        },
        entertainment: { items: ['dj'], times: { dj: slot('20:00', '23:00') }, activitiesPreference: null },
      }),
    ).toBe(true);
  });

  it('accepts a service slot that ends after midnight', () => {
    expect(
      isCompleteEvent({
        ...event,
        endTime: '01:30',
        endsNextDay: true,
        entertainment: {
          items: ['dj'],
          times: { dj: { ...slot('23:30', '01:00'), endsNextDay: true } },
          activitiesPreference: null,
        },
      }),
    ).toBe(true);
  });

  const food = (change: object) => ({ food: { ...event.food, ...change } });
  const drinks = (change: object) => ({ drinks: { ...event.drinks, ...change } });

  it.each([
    ['unknown event type', { type: 'funeral' }],
    ['missing date', { date: null }],
    ['impossible date', { date: '2027-02-30' }],
    ['end before start', { endTime: '18:00' }],
    ['end equal to start', { endTime: '18:30' }],
    ['end after 02:00 next day', { endTime: '03:00', endsNextDay: true }],
    ['bad time format', { startTime: '25:00' }],
    ['too few guests', { guests: 9 }],
    ['too many guests', { guests: 101 }],
    ['part of a guest', { guests: 50.5 }],
    ['no food', food({ items: [] })],
    ['no drinks', drinks({ items: [], packages: {} })],
    ['unknown food', food({ items: ['pizza'] })],
    ['duplicate food', food({ items: ['dinner', 'dinner'] })],
    ['excluded food pair', food({ items: ['private-chef', 'dinner'] })],
    ['excluded drinks pair', drinks({ items: ['wine-only', 'byo-drinks'] })],
    ['missing menu', food({ items: ['lunch'] })],
    ['unknown menu', food({ items: ['lunch'], menus: { lunch: 'sunday-table' } })],
    ['menu for a food not chosen', food({ menus: { lunch: 'copper-fork' } })],
    ['missing package', drinks({ packages: {} })],
    ['unknown package', drinks({ packages: { 'wine-only': 'four-cocktails' } })],
    ['missing service times', drinks({ items: ['wine-only', 'private-bartender'] })],
    [
      'service outside the event',
      drinks({
        items: ['wine-only', 'private-bartender'],
        times: { 'private-bartender': slot('17:00', '20:00') },
      }),
    ],
    ['budget below £500', { budget: 45_000 }],
    ['budget above £20,000', { budget: 2_005_000 }],
    ['budget off the £50 steps', { budget: 500_100 }],
    ['old budget band', { budget: '2500-5000' }],
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
