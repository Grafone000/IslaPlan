import type { EmailGateway } from '../contracts';

// Sends nothing: messages are stored in event_messages until a real provider is connected.
export const stubEmailGateway: EmailGateway = {
  async sendEmail() {
    return { messageId: `stub_email_${crypto.randomUUID()}` };
  },
};
