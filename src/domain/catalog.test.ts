import { describe, expect, it } from 'vitest';
import {
  budgetLimits,
  decorationOptions,
  drinkPackages,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodMenus,
  bottleProducts,
  bottlesPerGuest,
  foodOptions,
  glassSizes,
  menuFoods,
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

describe('party sizes and budget', () => {
  it('offer the agreed party sizes, contiguous and without overlaps', () => {
    expect(pairs(partySizes)).toEqual([
      ['size-10-20', 'From 10 to 20'],
      ['size-20-40', 'From 20 to 40'],
      ['size-40-60', 'From 40 to 60'],
      ['size-60-80', 'From 60 to 80'],
      ['size-up-to-100', 'Up to 100'],
    ]);
    partySizes.slice(1).forEach((size, index) => {
      expect(size.guestsMin).toBe(partySizes[index].guestsMax);
    });
  });

  it('set the budget from £500 to £20,000 in steps of £50', () => {
    expect(budgetLimits).toMatchObject({ minMinor: 50_000, maxMinor: 2_000_000, stepMinor: 5_000 });
  });

  it('start on a value they can reach', () => {
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

  it('offer four cocktail options for Cocktails/spirits only and Drinks all', () => {
    expect(drinkPackages['cocktails-spirits-only']).toHaveLength(4);
    expect(drinkPackages['drinks-all']).toHaveLength(4);
    for (const option of drinkPackages['drinks-all']) {
      expect(bottlesPerGuest[option.id]).toBe(option.id.startsWith('four') ? 1 : 0.5);
    }
  });

  it('list champagne and wines with a price and a picture each', () => {
    expect(bottleProducts.filter((bottle) => bottle.kind === 'sparkling').length).toBeGreaterThan(0);
    expect(bottleProducts.filter((bottle) => bottle.kind === 'wine').length).toBeGreaterThan(0);
    expect(new Set(bottleProducts.map((bottle) => bottle.id)).size).toBe(bottleProducts.length);
    for (const bottle of bottleProducts) {
      expect(Number.isInteger(bottle.priceMinor) && bottle.priceMinor > 0).toBe(true);
      expect(bottle.image).toMatch(/^\/images\/drinks\//);
    }
  });

  it('pour a bottle as 5, 4 or 3 glasses', () => {
    expect(glassSizes.map((size) => [size.label, size.glasses])).toEqual([
      ['5 glasses of 150 ml', 5],
      ['4 glasses of 175 ml', 4],
      ['3 glasses of 250 ml', 3],
    ]);
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
