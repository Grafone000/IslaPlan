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

// Party size and budget are sliders. The budget is in pence; its top value means "or more".
export const guestLimits = { min: 10, max: 100, step: 1, initial: 40 } as const;
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
  { id: 'cocktails-masterclass', label: 'Cocktails masterclass' },
  { id: 'wine-tasting', label: 'Wine tasting' },
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

export const drinkPackages: Record<PackagedDrink, readonly CatalogOption[]> = {
  'cocktails-spirits-only': [
    {
      id: 'four-cocktails-or-bottle',
      label: '4 cocktails per person, or 1 bottle of wine or prosecco/champagne each',
    },
    {
      id: 'three-cocktails-or-half-bottle',
      label: '3 cocktails per person, or ½ bottle of wine each',
    },
    {
      id: 'two-cocktails-or-half-bottle',
      label: '2 cocktails per person, or ½ bottle of wine each',
    },
    {
      id: 'one-cocktail-or-half-bottle',
      label: '1 cocktail per person, or ½ bottle of wine each',
    },
  ],
  'drinks-all': [
    { id: 'four-cocktails', label: '4 cocktails per person' },
    { id: 'three-cocktails', label: '3 cocktails per person' },
    { id: 'two-cocktails', label: '2 cocktails per person' },
    { id: 'one-cocktail', label: '1 cocktail per person' },
  ],
  'wine-only': [
    {
      id: 'prosecco-champagne-6-glasses',
      label: 'Prosecco/Champagne, 6 glasses',
    },
    { id: 'wine-150ml', label: 'Wine, 150 ml glass' },
    { id: 'wine-175ml', label: 'Wine, 175 ml glass' },
    { id: 'wine-250ml', label: 'Wine, 250 ml glass' },
  ],
};

export const isMenuFood = (id: string): id is MenuFood =>
  (menuFoods as readonly string[]).includes(id);
export const isPackagedDrink = (id: string): id is PackagedDrink =>
  (packagedDrinks as readonly string[]).includes(id);
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

export function packageLabel(drink: PackagedDrink, id: string | undefined): string {
  return drinkPackages[drink].find((option) => option.id === id)?.label ?? '';
}

export function guestsText(guests: number): string {
  return guests === 1 ? '1 guest' : `${guests} guests`;
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
    title: "What's the event you wish to plan?",
    kind: 'single',
    required: true,
    options: eventTypes,
  },
  { id: 'date-time', title: 'Date & Time', kind: 'date-time', required: true },
  { id: 'party-size', title: 'Party size', kind: 'slider', required: true },
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
