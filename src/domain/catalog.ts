// Option ids are a contract with the CRM: labels may change, ids never do.

export interface CatalogOption {
  id: string;
  label: string;
  excludes?: readonly string[];
  needsNote?: boolean;
}

export const eventTypes = [
  { id: 'wedding', label: 'Wedding' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'wedding-proposal', label: 'Wedding proposal' },
  { id: 'hen-stag-do', label: 'Hen Do/Stag Do' },
  { id: 'baby-shower', label: 'Baby showers' },
  { id: 'graduation', label: 'Graduation' },
  { id: 'girls-boys-night', label: "Girls' night/Boys' night" },
  { id: 'family-friends-reunion', label: 'Family/friends reunions' },
  { id: 'other-bespoke', label: 'Other/Bespoke', needsNote: true },
] as const satisfies readonly CatalogOption[];

export const partySizes = [
  { id: 'size-10-20', label: 'From 10 to 20', guestsMin: 10, guestsMax: 20 },
  { id: 'size-20-40', label: 'From 20 to 40', guestsMin: 20, guestsMax: 40 },
  { id: 'size-40-60', label: 'From 40 to 60', guestsMin: 40, guestsMax: 60 },
  { id: 'size-60-80', label: 'From 60 to 80', guestsMin: 60, guestsMax: 80 },
  { id: 'size-up-to-100', label: 'Up to 100', guestsMin: 80, guestsMax: 100 },
] as const satisfies readonly (CatalogOption & { guestsMin: number; guestsMax: number })[];

// The budget is a slider, in pence; its top value means "or more".
export const budgetLimits = {
  minMinor: 50_000,
  maxMinor: 2_000_000,
  stepMinor: 5_000,
  initialMinor: 250_000,
} as const;

export const foodOptions = [
  { id: 'brunch', label: 'Brunch' },
  { id: 'lunch', label: 'Lunch', excludes: ['private-chef'] },
  { id: 'dinner', label: 'Dinner', excludes: ['private-chef'] },
  { id: 'canapes', label: 'Canapés' },
  { id: 'afternoon-tea', label: 'Afternoon tea' },
  { id: 'private-chef', label: 'Private chef', excludes: ['lunch', 'dinner'] },
  { id: 'own-food', label: 'I bring my own food' },
] as const satisfies readonly CatalogOption[];

export const drinksOptions = [
  { id: 'private-bartender', label: 'Private bartender' },
  { id: 'private-sommelier', label: 'Private sommelier' },
  {
    id: 'drinks-all',
    label: 'Drinks all',
    excludes: ['wine-only', 'cocktails-spirits-only', 'byo-drinks'],
  },
  {
    id: 'wine-only',
    label: 'Wine only',
    excludes: ['drinks-all', 'byo-drinks'],
  },
  {
    id: 'cocktails-spirits-only',
    label: 'Cocktails/spirits only',
    excludes: ['drinks-all', 'byo-drinks'],
  },
  {
    id: 'byo-drinks',
    label: 'I bring my own drinks',
    excludes: ['drinks-all', 'wine-only', 'cocktails-spirits-only'],
  },
] as const satisfies readonly CatalogOption[];

export const entertainmentOptions = [
  { id: 'dj', label: 'DJ' },
  { id: 'live-music', label: 'Live music' },
  { id: 'activities', label: 'Activities | share your preference', needsNote: true },
] as const satisfies readonly CatalogOption[];

export const decorationOptions = [
  { id: 'flowers', label: 'Flowers' },
  { id: 'balloons', label: 'Balloons' },
  { id: 'personalised-items', label: 'Personalised/branded items' },
  { id: 'other-bespoke', label: 'Other/Bespoke', needsNote: true },
] as const satisfies readonly CatalogOption[];

export type EventTypeId = (typeof eventTypes)[number]['id'];
export type PartySizeId = (typeof partySizes)[number]['id'];
export type FoodId = (typeof foodOptions)[number]['id'];
export type DrinksId = (typeof drinksOptions)[number]['id'];
export type EntertainmentId = (typeof entertainmentOptions)[number]['id'];
export type DecorationId = (typeof decorationOptions)[number]['id'];

// Options that open more questions: a menu, a drinks package, a time slot or a note.
export const menuFoods = ['brunch', 'lunch', 'canapes', 'afternoon-tea', 'private-chef'] as const;
export const packagedDrinks = ['cocktails-spirits-only', 'drinks-all', 'wine-only'] as const;
export const timedDrinks = ['private-bartender', 'private-sommelier'] as const;
export const timedEntertainment = ['dj', 'live-music'] as const;

export type MenuFood = (typeof menuFoods)[number];
export type PackagedDrink = (typeof packagedDrinks)[number];
export type TimedDrink = (typeof timedDrinks)[number];
export type TimedEntertainment = (typeof timedEntertainment)[number];

export interface Menu {
  id: string;
  name: string;
  style: string;
  dishes: readonly string[];
}

export const foodMenus: Record<MenuFood, readonly Menu[]> = {
  brunch: [
    {
      id: 'sunday-table',
      name: 'The Sunday Table',
      style: 'Relaxed all-day brunch, seasonal British produce',
      dishes: [
        'Smashed avocado, poached eggs, dukkah on sourdough',
        'Buttermilk pancakes with maple butter and crispy bacon',
        'Shakshuka with feta and warm flatbread',
        'Fresh juice and coffee pairing',
      ],
    },
    {
      id: 'maple-and-rye',
      name: 'Maple & Rye',
      style: 'Cosy, comfort-food brunch',
      dishes: [
        'Eggs Benedict with honey-glazed ham',
        'Brioche French toast, berries, mascarpone',
        'Halloumi and roasted veg bagel',
        'Granola bowl with yoghurt and seasonal fruit',
      ],
    },
    {
      id: 'golden-hour-kitchen',
      name: 'Golden Hour Kitchen',
      style: 'Mediterranean-inspired sharing brunch',
      dishes: [
        'Sharing board: cured meats, cheeses, olives, fresh bread',
        'Ricotta and honey crostini',
        'Spinach and feta frittata',
        'Mini pastry basket with jams',
      ],
    },
  ],
  lunch: [
    {
      id: 'osteria-bellavista',
      name: 'Osteria Bellavista',
      style: 'Italian trattoria',
      dishes: [
        'Burrata with heritage tomatoes',
        'Handmade tagliatelle with slow-cooked ragù',
        'Grilled sea bass, lemon and capers',
        'Tiramisu',
      ],
    },
    {
      id: 'copper-fork',
      name: 'The Copper Fork',
      style: 'Modern European',
      dishes: [
        'Roast beetroot salad, goat’s cheese, walnuts',
        'Herb-crusted chicken supreme, creamy mash',
        'Wild mushroom risotto',
        'Dark chocolate fondant',
      ],
    },
    {
      id: 'saffron-and-smoke',
      name: 'Saffron & Smoke',
      style: 'Middle Eastern grill',
      dishes: [
        'Mezze platter: hummus, baba ganoush, tabbouleh',
        'Charcoal lamb kofta with flatbreads',
        'Grilled halloumi with pomegranate',
        'Baklava and mint tea',
      ],
    },
  ],
  canapes: [
    {
      id: 'petit-bouchee',
      name: 'Petit Bouchée',
      style: 'Classic French canapés',
      dishes: [
        'Smoked salmon blini with crème fraîche',
        'Beef tartare on toasted brioche',
        'Mini goat’s cheese and fig tartlets',
        'Salted caramel profiteroles',
      ],
    },
    {
      id: 'little-plates-co',
      name: 'Little Plates Co.',
      style: 'Creative, modern bites',
      dishes: [
        'Truffle arancini',
        'Tuna tataki on crispy rice',
        'Mini Yorkshire puddings with rare beef and horseradish',
        'Mango and chilli prawn skewers',
      ],
    },
    {
      id: 'garden-party',
      name: 'The Garden Party',
      style: 'Elegant vegetarian-friendly canapés',
      dishes: [
        'Courgette flower fritters with whipped ricotta',
        'Cucumber cups with minted pea purée',
        'Wild mushroom vol-au-vents',
        'Lemon posset shots',
      ],
    },
  ],
  'afternoon-tea': [
    {
      id: 'rosewater-room',
      name: 'The Rosewater Room',
      style: 'Traditional English afternoon tea',
      dishes: [
        'Finger sandwiches: cucumber, egg mayo, coronation chicken',
        'Freshly baked scones, clotted cream, strawberry jam',
        'Victoria sponge, lemon tart, macarons',
        'Selection of loose-leaf teas',
      ],
    },
    {
      id: 'lady-marmalades',
      name: 'Lady Marmalade’s',
      style: 'Whimsical, vintage-style tea',
      dishes: [
        'Smoked salmon and dill cream cheese rolls',
        'Earl Grey scones with lavender honey',
        'Mini carrot cake, raspberry choux buns',
        'Prosecco upgrade available',
      ],
    },
    {
      id: 'gilded-teapot',
      name: 'The Gilded Teapot',
      style: 'Luxury afternoon tea',
      dishes: [
        'Lobster brioche roll, truffle egg sandwiches',
        'Plain and raisin scones with Cornish clotted cream',
        'Pistachio éclair, rose panna cotta, chocolate entremet',
        'Premium teas and champagne option',
      ],
    },
  ],
  'private-chef': [
    {
      id: 'alessandro-rinaldi',
      name: 'Chef Alessandro Rinaldi',
      style: 'Modern Italian',
      dishes: [
        'Starter: seared scallops, cauliflower purée, crispy pancetta',
        'Main: slow-braised short rib, creamy polenta, red wine jus',
        'Dessert: limoncello tiramisu',
      ],
    },
    {
      id: 'camille-dubois',
      name: 'Chef Camille Dubois',
      style: 'Contemporary French',
      dishes: [
        'Starter: duck liver parfait, brioche, fig chutney',
        'Main: pan-roasted duck breast, dauphinoise potatoes, cherry sauce',
        'Dessert: Grand Marnier soufflé',
      ],
    },
    {
      id: 'naomi-hartley',
      name: 'Chef Naomi Hartley',
      style: 'Seasonal British',
      dishes: [
        'Starter: heritage tomato and burrata salad, basil oil',
        'Main: herb-crusted rack of lamb, minted peas, rosemary jus',
        'Dessert: sticky toffee pudding, vanilla ice cream',
      ],
    },
    {
      id: 'kenji-mori',
      name: 'Chef Kenji Mori',
      style: 'Japanese-European fusion',
      dishes: [
        'Starter: yellowtail crudo, yuzu, pickled radish',
        'Main: miso-glazed black cod, sesame greens, jasmine rice',
        'Dessert: matcha cheesecake, black sesame crumble',
      ],
    },
    {
      id: 'layla-haddad',
      name: 'Chef Layla Haddad',
      style: 'Middle Eastern and Mediterranean',
      dishes: [
        'Starter: mezze selection: smoky baba ganoush, spiced lamb sambousek',
        'Main: slow-roasted lamb shoulder, saffron rice, pomegranate salad',
        'Dessert: orange blossom panna cotta, pistachio crumble',
      ],
    },
  ],
};

// Cocktails per guest for Cocktails/spirits only and Drinks all. Drinks all also brings a
// bottle of wine or champagne per guest with 4 cocktails, half a bottle otherwise.
export type CocktailDrink = 'cocktails-spirits-only' | 'drinks-all';

export const drinkPackages: Record<CocktailDrink, readonly CatalogOption[]> = {
  'cocktails-spirits-only': [
    { id: 'four-cocktails', label: '4 cocktails per person' },
    { id: 'three-cocktails', label: '3 cocktails per person' },
    { id: 'two-cocktails', label: '2 cocktails per person' },
    { id: 'one-cocktail', label: '1 cocktail per person' },
  ],
  'drinks-all': [
    {
      id: 'four-cocktails-bottle',
      label: '4 cocktails per person + 1 bottle of wine or champagne per person',
    },
    {
      id: 'three-cocktails-half-bottle',
      label: '3 cocktails per person + ½ bottle of wine or champagne per person',
    },
    {
      id: 'two-cocktails-half-bottle',
      label: '2 cocktails per person + ½ bottle of wine or champagne per person',
    },
    {
      id: 'one-cocktail-half-bottle',
      label: '1 cocktail per person + ½ bottle of wine or champagne per person',
    },
  ],
};

// Bottles per guest that each Drinks all package brings.
export const bottlesPerGuest: Record<string, number> = {
  'four-cocktails-bottle': 1,
  'three-cocktails-half-bottle': 0.5,
  'two-cocktails-half-bottle': 0.5,
  'one-cocktail-half-bottle': 0.5,
};

export type BottleKind = 'sparkling' | 'wine';

export const bottleKinds: readonly { id: BottleKind; label: string }[] = [
  { id: 'sparkling', label: 'Champagne & sparkling wine' },
  { id: 'wine', label: 'Wine' },
];

export interface BottleProduct {
  id: string;
  kind: BottleKind;
  name: string;
  description: string;
  // Pence per 75 cl bottle.
  priceMinor: number;
  image: string;
}

// Placeholder list until the real wine list arrives: names and prices are made up.
const SPARKLING_IMAGE = '/images/drinks/sparkling.png';
const WINE_IMAGE = '/images/drinks/wine.png';

export const bottleProducts: readonly BottleProduct[] = [
  {
    id: 'prosecco-extra-dry',
    kind: 'sparkling',
    name: 'Prosecco Extra Dry',
    description: 'Fresh and fruity, from the Veneto hills',
    priceMinor: 2_400,
    image: SPARKLING_IMAGE,
  },
  {
    id: 'rose-spumante',
    kind: 'sparkling',
    name: 'Rosé Spumante',
    description: 'Pale pink, with notes of wild strawberry',
    priceMinor: 2_800,
    image: SPARKLING_IMAGE,
  },
  {
    id: 'cremant-brut',
    kind: 'sparkling',
    name: 'Crémant Brut',
    description: 'Fine bubbles and a crisp apple finish',
    priceMinor: 3_200,
    image: SPARKLING_IMAGE,
  },
  {
    id: 'franciacorta-saten',
    kind: 'sparkling',
    name: 'Franciacorta Satèn',
    description: 'Creamy and elegant, made the traditional way',
    priceMinor: 4_500,
    image: SPARKLING_IMAGE,
  },
  {
    id: 'champagne-brut-reserve',
    kind: 'sparkling',
    name: 'Champagne Brut Réserve',
    description: 'Toasted brioche, citrus and a long finish',
    priceMinor: 6_000,
    image: SPARKLING_IMAGE,
  },
  {
    id: 'house-red',
    kind: 'wine',
    name: 'House Red',
    description: 'Soft and easy, for every table',
    priceMinor: 1_600,
    image: WINE_IMAGE,
  },
  {
    id: 'pinot-grigio',
    kind: 'wine',
    name: 'Pinot Grigio',
    description: 'Light white with pear and lemon',
    priceMinor: 1_800,
    image: WINE_IMAGE,
  },
  {
    id: 'montepulciano',
    kind: 'wine',
    name: 'Montepulciano d’Abruzzo',
    description: 'Round red with ripe cherry',
    priceMinor: 2_000,
    image: WINE_IMAGE,
  },
  {
    id: 'sauvignon-blanc',
    kind: 'wine',
    name: 'Sauvignon Blanc',
    description: 'Zesty white with fresh herbs',
    priceMinor: 2_200,
    image: WINE_IMAGE,
  },
  {
    id: 'chianti-classico',
    kind: 'wine',
    name: 'Chianti Classico',
    description: 'Tuscan red with violet and spice',
    priceMinor: 2_800,
    image: WINE_IMAGE,
  },
  {
    id: 'rioja-reserva',
    kind: 'wine',
    name: 'Rioja Reserva',
    description: 'Oak-aged red with vanilla and plum',
    priceMinor: 3_000,
    image: WINE_IMAGE,
  },
];

// How a bottle is poured: the glass size sets the number of glasses per bottle.
export const glassSizes = [
  { id: 'glass-150', label: '5 glasses of 150 ml', glasses: 5 },
  { id: 'glass-175', label: '4 glasses of 175 ml', glasses: 4 },
  { id: 'glass-250', label: '3 glasses of 250 ml', glasses: 3 },
] as const satisfies readonly (CatalogOption & { glasses: number })[];

export type GlassSizeId = (typeof glassSizes)[number]['id'];

export const MAX_BOTTLES = 500;

export function glassSizeOf(id: string | undefined) {
  return glassSizes.find((size) => size.id === id);
}

export function bottleOf(id: string | null | undefined): BottleProduct | undefined {
  return bottleProducts.find((product) => product.id === id);
}

export const isMenuFood = (id: string): id is MenuFood =>
  (menuFoods as readonly string[]).includes(id);
export const isPackagedDrink = (id: string): id is PackagedDrink =>
  (packagedDrinks as readonly string[]).includes(id);
export const isCocktailDrink = (id: string): id is CocktailDrink =>
  id === 'cocktails-spirits-only' || id === 'drinks-all';
export const isTimedDrink = (id: string): id is TimedDrink =>
  (timedDrinks as readonly string[]).includes(id);
export const isTimedEntertainment = (id: string): id is TimedEntertainment =>
  (timedEntertainment as readonly string[]).includes(id);

export type PricedCategory = 'food' | 'drinks' | 'entertainment' | 'decorations';

export const pricedCategoryOptions: Record<PricedCategory, readonly CatalogOption[]> = {
  food: foodOptions,
  drinks: drinksOptions,
  entertainment: entertainmentOptions,
  decorations: decorationOptions,
};

export function itemLabel(category: PricedCategory, item: string): string {
  return pricedCategoryOptions[category].find((option) => option.id === item)?.label ?? item;
}

export function eventTypeLabel(id: string | null): string {
  return eventTypes.find((type) => type.id === id)?.label ?? '';
}

export function menuOf(food: MenuFood, id: string | undefined): Menu | undefined {
  return foodMenus[food].find((menu) => menu.id === id);
}

export function packageLabel(drink: CocktailDrink, id: string | undefined): string {
  return drinkPackages[drink].find((option) => option.id === id)?.label ?? '';
}

export function partySizeOf(id: string | null | undefined) {
  return partySizes.find((size) => size.id === id);
}

// Reads naturally inside a sentence: "40 to 60 guests", "up to 100 guests".
export function guestsText(id: string | null | undefined): string {
  const size = partySizeOf(id);
  if (!size) return '';
  return size.id === 'size-up-to-100'
    ? `up to ${size.guestsMax} guests`
    : `${size.guestsMin} to ${size.guestsMax} guests`;
}

export function partySizeLabel(id: string | null | undefined): string {
  return partySizeOf(id)?.label ?? '';
}

export type StepKind =
  'single' | 'multiple' | 'date-time' | 'slider' | 'text' | 'contact' | 'menu' | 'package';

export interface WizardStep {
  id: string;
  title: string;
  kind: StepKind;
  required: boolean;
  options?: readonly CatalogOption[];
}

export const wizardSteps = [
  {
    id: 'event-type',
    title: 'Tell us, what are you planning?',
    kind: 'single',
    required: true,
    options: eventTypes,
  },
  { id: 'date-time', title: 'Date & Time', kind: 'date-time', required: true },
  {
    id: 'party-size',
    title: 'Party size',
    kind: 'single',
    required: true,
    options: partySizes,
  },
  { id: 'food', title: 'Food', kind: 'multiple', required: true, options: foodOptions },
  { id: 'drinks', title: 'Drinks', kind: 'multiple', required: true, options: drinksOptions },
  {
    id: 'entertainment',
    title: 'Entertainment',
    kind: 'multiple',
    required: false,
    options: entertainmentOptions,
  },
  {
    id: 'decorations',
    title: 'Decorations',
    kind: 'multiple',
    required: false,
    options: decorationOptions,
  },
  {
    id: 'additional-info',
    title: 'Any additional information',
    kind: 'text',
    required: false,
  },
  { id: 'budget', title: 'Budget', kind: 'slider', required: true },
  { id: 'contact', title: 'Contact details', kind: 'contact', required: true },
] as const satisfies readonly WizardStep[];

export type FixedStepId = (typeof wizardSteps)[number]['id'];

// One extra page per chosen menu food and drinks package, right after Food and Drinks.
export type MenuStepId = `menu-${MenuFood}`;
export type PackageStepId = `package-${PackagedDrink}`;
export type WizardStepId = FixedStepId | MenuStepId | PackageStepId;
