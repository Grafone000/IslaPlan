import { describe, expect, it } from 'vitest';
import {
  budgetBands,
  decorationOptions,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodOptions,
  partySizes,
  wizardSteps,
  type CatalogOption,
} from './catalog';

const pairs = (options: readonly CatalogOption[]) => options.map((o) => [o.id, o.label]);

describe('catalog ids and labels', () => {
  it('matches the agreed event types', () => {
    expect(pairs(eventTypes)).toEqual([
      ['wedding', 'Wedding'],
      ['birthday', 'Birthday'],
      ['engagement', 'Engagement'],
      ['wedding-proposal', 'Wedding proposal'],
      ['hen-stag-do', 'Hen Do/Stag Do'],
      ['baby-shower', 'Baby showers'],
      ['graduation', 'Graduation'],
      ['girls-boys-night', "Girls' night/Boys' night"],
      ['family-friends-reunion', 'Family/friends reunions'],
      ['other-bespoke', 'Other/Bespoke'],
    ]);
  });

  it('matches the agreed party sizes', () => {
    expect(pairs(partySizes)).toEqual([
      ['size-10-20', 'From 10 to 20'],
      ['size-20-40', 'From 20 to 40'],
      ['size-40-60', 'From 40 to 60'],
      ['size-60-80', 'From 60 to 80'],
      ['size-up-to-100', 'Up to 100'],
    ]);
  });

  it('matches the agreed food options', () => {
    expect(pairs(foodOptions)).toEqual([
      ['private-chef', 'Private chef'],
      ['lunch', 'Lunch'],
      ['dinner', 'Dinner'],
      ['afternoon-tea', 'Afternoon tea'],
      ['canapes', 'Canapes style'],
    ]);
  });

  it('matches the agreed drinks options', () => {
    expect(pairs(drinksOptions)).toEqual([
      ['cocktails-masterclass', 'Cocktails masterclass'],
      ['wine-tasting', 'Wine tasting'],
      ['private-bartender', 'Private bartender'],
      ['private-sommelier', 'Private sommelier'],
      ['drinks-all', 'Drinks all'],
      ['wine-only', 'Wine only'],
      ['cocktails-spirits-only', 'Cocktails/spirits only'],
      ['byo-drinks', 'I bring my own drinks'],
    ]);
  });

  it('matches the agreed entertainment options', () => {
    expect(pairs(entertainmentOptions)).toEqual([
      ['dj', 'DJ'],
      ['live-music', 'Live music'],
      ['activities', 'Activities | share your preference'],
    ]);
  });

  it('matches the agreed decoration options', () => {
    expect(pairs(decorationOptions)).toEqual([
      ['flowers', 'Flowers'],
      ['balloons', 'Balloons'],
      ['personalised-items', 'Personalised/branded items'],
      ['other-bespoke', 'Other/Bespoke'],
    ]);
  });

  it('matches the agreed budget bands', () => {
    expect(pairs(budgetBands)).toEqual([
      ['under-1000', 'Under £1,000'],
      ['1000-2500', '£1,000-£2,500'],
      ['2500-5000', '£2,500-£5,000'],
      ['5000-10000', '£5,000-£10,000'],
      ['over-10000', 'Over £10,000'],
    ]);
  });
});

describe('party sizes', () => {
  it('are contiguous and do not overlap', () => {
    partySizes.slice(1).forEach((size, index) => {
      expect(size.guestsMin).toBe(partySizes[index].guestsMax);
    });
    expect(partySizes[0].guestsMin).toBe(10);
    expect(partySizes.at(-1)?.guestsMax).toBe(100);
  });
});

describe('exclusions', () => {
  it.each([
    ['food', foodOptions],
    ['drinks', drinksOptions],
  ] as const)('are symmetric and reference real %s options', (_name, options) => {
    const list: readonly CatalogOption[] = options;
    for (const option of list) {
      for (const excluded of option.excludes ?? []) {
        const other = list.find((o) => o.id === excluded);
        expect(other, `${option.id} excludes unknown ${excluded}`).toBeDefined();
        expect(other?.excludes, `${excluded} must exclude ${option.id}`).toContain(option.id);
      }
    }
  });
});

describe('wizard steps', () => {
  it('runs in the agreed order', () => {
    expect(wizardSteps.map((step) => step.id)).toEqual([
      'event-type',
      'date-time',
      'party-size',
      'food',
      'drinks',
      'entertainment',
      'decorations',
      'additional-info',
      'budget',
      'contact',
    ]);
  });

  it('lets only entertainment, decorations and additional info be skipped', () => {
    const optional = wizardSteps.filter((step) => !step.required).map((step) => step.id);
    expect(optional).toEqual(['entertainment', 'decorations', 'additional-info']);
  });
});
