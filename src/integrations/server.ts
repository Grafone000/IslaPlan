import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { business } from '@/config/business';
import { priceTableV1 } from '@/domain/pricing/table.v1';
import type { MessageServiceDeps } from './messageService';
import type { RequestServiceDeps } from './requestService';
import { stubCrmGateway } from './stubs/crm';
import { stubEmailGateway } from './stubs/email';
import { publicSupabaseConfig } from './supabase/config';
import { supabaseAttachmentStore, supabaseMessageRepository } from './supabase/messages';
import { supabaseRequestRepository } from './supabase/requests';

// Server-side counterpart of index.ts. Route handlers import from here; screens never do.

function requirePublicConfig() {
  const config = publicSupabaseConfig();
  if (!config) {
    throw new Error('Supabase is not configured');
  }
  return config;
}

function adminClient() {
  const { url } = requirePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Supabase is not configured');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function sessionClient() {
  const { url, anonKey } = requirePublicConfig();
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value, options }) => store.set(name, value, options));
      },
    },
  });
}

export async function sessionUser() {
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function requestServiceDeps(): RequestServiceDeps {
  return {
    requests: supabaseRequestRepository(adminClient()),
    crm: stubCrmGateway,
    pricing: { table: priceTableV1, config: business },
    now: () => new Date().toISOString(),
  };
}

export function messageServiceDeps(): MessageServiceDeps {
  const admin = adminClient();
  return {
    requests: supabaseRequestRepository(admin),
    messages: supabaseMessageRepository(admin),
    attachments: supabaseAttachmentStore(admin),
    email: stubEmailGateway,
    organiserEmail: business.contactEmail,
    now: () => new Date().toISOString(),
    newId: () => crypto.randomUUID(),
  };
}

export async function linkGuestRequestsForSession(): Promise<void> {
  if (process.env.LINK_GUEST_REQUESTS !== 'true') {
    return;
  }
  const user = await sessionUser();
  if (user?.email && user.email_confirmed_at) {
    await supabaseRequestRepository(adminClient()).linkGuestRequests(user.id, user.email);
  }
}
