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

export const foodOptions = [
  { id: 'private-chef', label: 'Private chef', excludes: ['lunch', 'dinner'] },
  { id: 'lunch', label: 'Lunch', excludes: ['private-chef'] },
  { id: 'dinner', label: 'Dinner', excludes: ['private-chef'] },
  { id: 'afternoon-tea', label: 'Afternoon tea' },
  { id: 'canapes', label: 'Canapes style' },
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
    excludes: ['drinks-all', 'cocktails-spirits-only', 'byo-drinks'],
  },
  {
    id: 'cocktails-spirits-only',
    label: 'Cocktails/spirits only',
    excludes: ['drinks-all', 'wine-only', 'byo-drinks'],
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

// maxMinor is the top of the band in pence; null means the band has no upper limit.
export const budgetBands = [
  { id: 'under-1000', label: 'Under £1,000', maxMinor: 100_000 },
  { id: '1000-2500', label: '£1,000-£2,500', maxMinor: 250_000 },
  { id: '2500-5000', label: '£2,500-£5,000', maxMinor: 500_000 },
  { id: '5000-10000', label: '£5,000-£10,000', maxMinor: 1_000_000 },
  { id: 'over-10000', label: 'Over £10,000', maxMinor: null },
] as const satisfies readonly (CatalogOption & { maxMinor: number | null })[];

export type EventTypeId = (typeof eventTypes)[number]['id'];
export type PartySizeId = (typeof partySizes)[number]['id'];
export type FoodId = (typeof foodOptions)[number]['id'];
export type DrinksId = (typeof drinksOptions)[number]['id'];
export type EntertainmentId = (typeof entertainmentOptions)[number]['id'];
export type DecorationId = (typeof decorationOptions)[number]['id'];
export type BudgetId = (typeof budgetBands)[number]['id'];

export type PricedCategory = 'food' | 'drinks' | 'entertainment' | 'decorations';

export type StepKind = 'single' | 'multiple' | 'date-time' | 'text' | 'contact';

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
  { id: 'budget', title: 'Budget', kind: 'single', required: true, options: budgetBands },
  { id: 'contact', title: 'Contact details', kind: 'contact', required: true },
] as const satisfies readonly WizardStep[];

export type WizardStepId = (typeof wizardSteps)[number]['id'];
