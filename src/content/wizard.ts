export const wizardContent = {
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
  notes: {
    eventType: 'Tell us about your event',
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
