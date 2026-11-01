import type { ComponentType } from 'react';
import type { Contact, EventRequest } from '@/domain/request';

export interface Account extends Contact {
  id: string;
}

export interface RegisterInput extends Contact {
  password: string;
}

export type AuthError =
  | 'invalid-credentials'
  | 'email-taken'
  | 'weak-password'
  | 'unavailable'
  | 'unknown';

export type AuthResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: AuthError };

export interface AuthProvider {
  register(input: RegisterInput): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  currentAccount(): Promise<Account | null>;
}

export interface RequestRepository {
  create(request: EventRequest): Promise<void>;
  // Returns false when the stored revision is no longer expectedRevision.
  update(request: EventRequest, expectedRevision: number): Promise<boolean>;
  get(id: string): Promise<EventRequest | null>;
  listByAccount(accountId: string): Promise<EventRequest[]>;
  linkGuestRequests(accountId: string, email: string): Promise<void>;
}

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  storagePath: string;
}

export interface EventMessage {
  id: string;
  requestId: string;
  direction: 'client' | 'organiser';
  subject: string;
  body: unknown;
  bodyText: string;
  attachments: MessageAttachment[];
  createdAt: string;
}

export interface MessageRepository {
  list(requestId: string): Promise<EventMessage[]>;
  add(message: Omit<EventMessage, 'id' | 'createdAt'>): Promise<EventMessage>;
}

export interface EventPhoto {
  name: string;
  url: string;
}

export interface PhotoRepository {
  list(requestId: string): Promise<EventPhoto[]>;
}

export interface SubmitResult {
  ok: boolean;
}

export interface CrmGateway {
  submitRequest(request: EventRequest): Promise<SubmitResult>;
}

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  bodyText: string;
}

export interface EmailGateway {
  sendEmail(message: EmailMessage): Promise<{ messageId: string }>;
}

export interface DepositInput {
  requestId: string;
  amount: number;
  currency: string;
}

export interface DepositPayment {
  paymentId: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  status: 'paid' | 'failed';
}

// Opaque by design: card fields stay inside the provider's form and never pass through here.
export interface CardFormHandle {
  confirm(): Promise<PaymentResult>;
}

export interface CardFormProps {
  onReady(handle: CardFormHandle): void;
}

export interface PaymentProvider {
  CardForm: ComponentType<CardFormProps>;
  createDepositPayment(input: DepositInput): Promise<DepositPayment>;
  confirmDepositPayment(paymentId: string, handle: CardFormHandle): Promise<PaymentResult>;
}
