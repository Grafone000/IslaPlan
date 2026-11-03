import { describe, expect, it } from 'vitest';
import {
  budgetLimits,
  decorationOptions,
  drinkPackages,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodMenus,
  foodOptions,
  guestLimits,
  menuFoods,
  packagedDrinks,
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

  it('matches the agreed food options', () => {
    expect(pairs(foodOptions)).toEqual([
      ['brunch', 'Brunch'],
      ['lunch', 'Lunch'],
      ['dinner', 'Dinner'],
      ['canapes', 'Canapés'],
      ['afternoon-tea', 'Afternoon tea'],
      ['private-chef', 'Private chef'],
      ['own-food', 'I bring my own food'],
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

});

describe('sliders', () => {
  it('count guests from 10 to 100 one at a time', () => {
    expect(guestLimits).toMatchObject({ min: 10, max: 100, step: 1 });
  });

  it('set the budget from £500 to £20,000 in steps of £50', () => {
    expect(budgetLimits).toMatchObject({ minMinor: 50_000, maxMinor: 2_000_000, stepMinor: 5_000 });
  });

  it('start on a value they can reach', () => {
    expect((guestLimits.initial - guestLimits.min) % guestLimits.step).toBe(0);
    expect((budgetLimits.initialMinor - budgetLimits.minMinor) % budgetLimits.stepMinor).toBe(0);
  });
});

describe('menus and drinks packages', () => {
  it('offer three menus per food, and five private chefs', () => {
    expect(menuFoods.map((food) => [food, foodMenus[food].length])).toEqual([
      ['brunch', 3],
      ['lunch', 3],
      ['canapes', 3],
      ['afternoon-tea', 3],
      ['private-chef', 5],
    ]);
  });

  it('offer four options per drinks package', () => {
    for (const drink of packagedDrinks) {
      expect(drinkPackages[drink]).toHaveLength(4);
    }
  });

  it('have unique ids within each list', () => {
    for (const list of [...Object.values(foodMenus), ...Object.values(drinkPackages)]) {
      expect(new Set(list.map((entry) => entry.id)).size).toBe(list.length);
    }
  });

  it('let Wine only and Cocktails/spirits only be chosen together', () => {
    const wine = drinksOptions.find((option) => option.id === 'wine-only');
    expect(wine?.excludes).not.toContain('cocktails-spirits-only');
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
