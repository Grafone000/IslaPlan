import type { MenuFood, PackagedDrink } from '@/domain/catalog';

const menuTitles: Record<MenuFood, string> = {
  brunch: 'Choose your brunch menu',
  lunch: 'Choose your lunch menu',
  canapes: 'Choose your canapés',
  'afternoon-tea': 'Choose your afternoon tea',
  'private-chef': 'Choose your private chef',
};

const packageTitles: Record<PackagedDrink, string> = {
  'cocktails-spirits-only': 'Cocktails/spirits only: how much per guest?',
  'drinks-all': 'Drinks all: how many cocktails per guest?',
  'wine-only': 'Wine only: what would you like?',
};

export const wizardContent = {
  menuTitles,
  packageTitles,
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
  actions: {
    back: 'Back',
    continue: 'Continue',
    skip: 'Skip this step',
    seeEstimate: 'See my estimate',
  },
  hints: {
    multiple: 'Choose as many as you like.',
    budget: 'A rough idea is fine. It helps us suggest the right options.',
    guests: 'Slide to the number of guests you expect.',
    menu: 'Tap the menu you like.',
    package: 'Choose one option.',
    contact: "We'll use these details to send you your estimate.",
  },
  removed: (removed: string, picked: string) =>
    `${removed} can't be combined with ${picked}, so we've removed it.`,
  dateTime: {
    date: 'Choose a date',
    start: 'Start time',
    end: 'End time',
    placeholder: 'Select a time',
    nextDay: '(next day)',
  },
  sliders: {
    guests: 'Number of guests',
    guestsValue: (guests: number) => `${guests} guests`,
    budget: 'Your budget',
    budgetValue: (amount: string, isTop: boolean) => (isTop ? `${amount} or more` : amount),
  },
  slot: {
    start: 'Start time',
    end: 'End time',
    nextDay: '(next day)',
    label: (item: string, part: string) => `${item}: ${part.toLowerCase()}`,
  },
  notes: {
    eventType: 'Tell us about your event',
    ownFood: 'What will you bring? (optional)',
    ownDrinks: 'What will you bring? (optional)',
    activities: 'Share your preference',
    decorations: 'Tell us what you have in mind',
    additional: 'Anything else we should know?',
  },
  contact: {
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    required: 'Please fill in every field.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
  },
  saving: 'Preparing your estimate...',
  saveError: "We couldn't save your request. Please try again.",
  loading: 'One moment...',
} as const;
