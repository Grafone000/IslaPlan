// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs against the Supabase project in .env.local, and is skipped until that is set up.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const PASSWORD = 'integration-test-password';
const stamp = Date.now();
const emails = [`rls-a-${stamp}@example.com`, `rls-b-${stamp}@example.com`];
const requestId = crypto.randomUUID();

// The connection to Supabase sometimes times out on this network. Only that is retried.
async function withConnectRetry<T>(call: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      if (attempt === attempts || (error as Error).name !== 'AuthRetryableFetchError') throw error;
    }
  }
}

describe.skipIf(!configured)('row level security', () => {
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  let admin: SupabaseClient;
  let owner: SupabaseClient;
  let stranger: SupabaseClient;
  let anonymous: SupabaseClient;
  const userIds: string[] = [];

  async function signIn(email: string) {
    const client = createClient(url as string, anonKey as string, noSession);
    await client.auth.signInWithPassword({ email, password: PASSWORD });
    return client;
  }

  beforeAll(async () => {
    admin = createClient(url as string, serviceKey as string, noSession);
    anonymous = createClient(url as string, anonKey as string, noSession);
    for (const email of emails) {
      const { data, error } = await withConnectRetry(() =>
        admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { first_name: 'Test', last_name: 'User', phone: '07700900000' },
        }),
      );
      if (error) throw error;
      userIds.push(data.user.id);
    }
    owner = await signIn(emails[0]);
    stranger = await signIn(emails[1]);

    const now = new Date().toISOString();
    const { error } = await admin.from('event_requests').insert({
      id: requestId,
      schema_version: 1,
      revision: 2,
      status: 'estimated',
      account_id: userIds[0],
      contact_email: emails[0],
      created_at: now,
      updated_at: now,
      payload: {},
    });
    if (error) throw error;
    await admin.from('event_messages').insert({
      request_id: requestId,
      direction: 'client',
      body: {},
    });
  }, 60_000);

  afterAll(async () => {
    await admin?.from('event_requests').delete().eq('id', requestId);
    for (const id of userIds) {
      await admin.auth.admin.deleteUser(id);
    }
  }, 30_000);

  it('creates a profile from the sign-up details', async () => {
    const { data } = await owner.from('profiles').select('first_name, phone').single();
    expect(data).toEqual({ first_name: 'Test', phone: '07700900000' });
  });

  it('lets a user read only their own profile', async () => {
    const { data } = await stranger.from('profiles').select('id').eq('id', userIds[0]);
    expect(data).toEqual([]);
  });

  it('lets the owner read their request and messages', async () => {
    const { data: requests } = await owner.from('event_requests').select('id');
    const { data: messages } = await owner.from('event_messages').select('id');
    expect(requests).toHaveLength(1);
    expect(messages).toHaveLength(1);
  });

  it.each([['stranger'], ['anonymous']])('hides requests and messages from %s', async (who) => {
    const client = who === 'stranger' ? stranger : anonymous;
    const { data: requests } = await client.from('event_requests').select('id');
    const { data: messages } = await client.from('event_messages').select('id');
    expect(requests).toEqual([]);
    expect(messages).toEqual([]);
  });

  it('blocks clients from writing requests', async () => {
    const { error } = await owner.from('event_requests').update({ status: 'deposit-paid' }).eq(
      'id',
      requestId,
    );
    const { data } = await admin.from('event_requests').select('status').eq('id', requestId);
    expect(error === null || error.message.length > 0).toBe(true);
    expect(data?.[0].status).toBe('estimated');
  });

  it('keeps storage buckets private', async () => {
    const { data } = await admin.storage.getBucket('event-photos');
    expect(data?.public).toBe(false);
    const attachments = await admin.storage.getBucket('message-attachments');
    expect(attachments.data?.public).toBe(false);
  });
});
