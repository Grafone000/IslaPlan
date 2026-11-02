import type { PaymentGateway } from '../contracts';

// Moves no money. verifyPayment has nothing to check, so it repeats what the browser reported;
// the real gateway must ask the provider instead.
export const stubPaymentGateway: PaymentGateway = {
  provider: 'stub',
  async createDepositPayment({ amount, currency }) {
    return { paymentId: `stub_pay_${crypto.randomUUID()}`, amount, currency };
  },
  async verifyPayment(_paymentId, reported) {
    return reported;
  },
};
