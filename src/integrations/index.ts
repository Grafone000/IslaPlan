import type { AuthProvider, PaymentProvider } from './contracts';
import { stubPaymentProvider } from './stubs/payment';
import { supabaseAuth } from './supabase/auth';

// The single place that picks implementations for screens. Browser-safe only: server code
// lives in server.ts.
export const auth: AuthProvider = supabaseAuth;
export const payments: PaymentProvider = stubPaymentProvider;

export { draftStore } from './draftStore';
export { requestsApi } from './requestsApi';
export type { Account, AuthError, CardFormHandle } from './contracts';
