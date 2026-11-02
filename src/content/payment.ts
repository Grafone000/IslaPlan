export const paymentContent = {
  demo: 'Demo: no card will be charged. Use a test card, never a real one.',
  testCards: 'Successful payment: 4242 4242 4242 4242. Declined payment: 4000 0000 0000 0002.',
  fields: {
    name: 'Name on card',
    number: 'Card number',
    expiry: 'Expiry (MM/YY)',
    cvc: 'CVC',
  },
  errors: {
    required: 'Please fill in every card field.',
    testOnly: 'This is a demo. Please use one of the test cards above.',
    expiry: 'Please enter a valid expiry date, for example 12/30.',
    cvc: 'Please enter the 3 or 4 digit CVC.',
    declined: 'Your card was declined. Please try another card.',
    failed: 'Something went wrong. Please try again.',
  },
  pay: (amount: string) => `Pay ${amount}`,
  paying: 'Processing...',
} as const;
