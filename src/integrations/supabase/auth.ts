import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Account, AuthError, AuthProvider, AuthResult } from '../contracts';
import { publicSupabaseConfig } from './config';

let client: SupabaseClient | null = null;

function browserClient(): SupabaseClient | null {
  const config = publicSupabaseConfig();
  if (!config) {
    return null;
  }
  client ??= createBrowserClient(config.url, config.anonKey);
  return client;
}

const unavailable: AuthResult = { ok: false, error: 'unavailable' };

function toAuthError(code: string | undefined): AuthError {
  switch (code) {
    case 'invalid_credentials':
    case 'email_not_confirmed':
      return 'invalid-credentials';
    case 'user_already_exists':
    case 'email_exists':
      return 'email-taken';
    case 'weak_password':
      return 'weak-password';
    default:
      return 'unknown';
  }
}

const callbackUrl = (next: string) =>
  `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

export const supabaseAuth: AuthProvider = {
  async register({ firstName, lastName, email, phone, password }) {
    const supabase = browserClient();
    if (!supabase) return unavailable;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone },
        emailRedirectTo: callbackUrl('/'),
      },
    });
    if (error) return { ok: false, error: toAuthError(error.code) };
    return { ok: true, needsEmailConfirmation: data.session === null };
  },

  async login(email, password) {
    const supabase = browserClient();
    if (!supabase) return unavailable;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: toAuthError(error.code) };
    return { ok: true, needsEmailConfirmation: false };
  },

  async logout() {
    await browserClient()?.auth.signOut();
  },

  async requestPasswordReset(email) {
    const supabase = browserClient();
    if (!supabase) return unavailable;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl('/reset-password'),
    });
    if (error) return { ok: false, error: toAuthError(error.code) };
    return { ok: true, needsEmailConfirmation: false };
  },

  async updatePassword(password) {
    const supabase = browserClient();
    if (!supabase) return unavailable;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: toAuthError(error.code) };
    return { ok: true, needsEmailConfirmation: false };
  },

  async currentAccount(): Promise<Account | null> {
    const supabase = browserClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', data.user.id)
      .maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? '',
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      phone: profile?.phone ?? '',
    };
  },
};
