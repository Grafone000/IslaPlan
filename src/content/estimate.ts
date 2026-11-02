import { guestsText } from '@/domain/catalog';

export const estimateContent = {
  title: 'Your estimate',
  indicative: 'This is an indicative estimate based on your choices. We confirm the final price with you.',
  onRequest: 'Priced on request',
  onRequestBody: "Your event is bespoke, so we'll price it with you personally.",
  guests: (partySize: string) => `For ${guestsText(partySize)}`,
  chosen: 'What you chose',
  onRequestItems: "Priced on request, so not included above:",
  corkage: 'I bring my own drinks covers service or corkage only, not the drinks.',
  changeChoices: 'Change my choices',
  questions: {
    accept: 'Are you happy with this estimate?',
    consultation: 'Would you like a phone consultation?',
    proceed: 'Would you like to proceed?',
  },
  answers: { yes: 'Yes', no: 'No' },
  consultation: {
    intro: 'Get in touch with us whichever way suits you.',
    rate: (rate: string) => `Phone calls cost ${rate}/min.`,
    call: 'Call us',
    email: 'Email us',
  },
  deposit: {
    title: 'Your deposit',
    intro: (percent: number) => `To go ahead we ask for a ${percent}% deposit.`,
    notNow: 'Not now',
  },
  revise: {
    title: "Let's adjust your estimate",
    intro: "Here's what makes up your estimate, and the changes that would save the most.",
    current: 'Your current estimate',
    drivers: 'What costs the most',
    suggestions: 'Ways to save',
    saving: (amount: string) => `Saves about ${amount}`,
    change: 'Change this',
    overBudget: (amount: string, budget: string) =>
      `This is about ${amount} above the ${budget} budget you chose.`,
    withinBudget: (budget: string) => `This fits within the ${budget} budget you chose.`,
    other: 'Change something else',
    keep: 'Keep this estimate',
    stop: 'No thanks, I would rather stop here',
    smallerParty: (partySize: string) => `Plan for ${guestsText(partySize)}`,
    swap: (from: string, to: string) => `Switch ${from} to ${to}`,
    remove: (item: string) => `Remove ${item}`,
  },
  outcome: {
    title: 'Thank you',
    declined: {
      estimate:
        "Thank you for considering us. We've kept your choices, and we'd love to help if you change your mind.",
      proceed:
        "No problem at all. We've saved your request, and you're welcome to come back whenever you're ready.",
      deposit:
        "That's absolutely fine. We've saved your request, so you can pick things up with us any time.",
    },
    inTouch: "We've got everything we need. We'll be in touch soon to talk through your event.",
    paid: "Your deposit is paid. We'll be in touch to confirm the details and start bringing your plans to life.",
    home: 'Back to the home page',
  },
  error: "Something went wrong. Please try again.",
} as const;
