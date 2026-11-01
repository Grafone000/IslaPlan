import type { AuthProvider } from './contracts';
import { supabaseAuth } from './supabase/auth';

// The single place that picks implementations for screens. Browser-safe only: server code
// lives in server.ts.
export const auth: AuthProvider = supabaseAuth;

export { draftStore } from './draftStore';
export { requestsApi } from './requestsApi';
export type { Account, AuthError } from './contracts';
