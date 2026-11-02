import { createClient } from '@supabase/supabase-js';

// Removes requests made with the fixed test addresses, their files and test accounts. It runs
// after every test run, so nothing stays behind when a failed test restarts its worker.
export const TEST_EMAILS = [
  'estimate-e2e@example.com',
  'guest-e2e@example.com',
  'composer-e2e@example.com',
  'deposit-e2e@example.com',
  'account-e2e@example.com',
];

const TEST_ACCOUNT_PREFIX = 'e2e-';

export default async function globalTeardown() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return;
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: requests } = await admin
    .from('event_requests')
    .select('id')
    .in('contact_email', TEST_EMAILS);

  for (const { id } of requests ?? []) {
    const { data: messages } = await admin
      .from('event_messages')
      .select('attachments')
      .eq('request_id', id);
    const paths = (messages ?? []).flatMap((message) =>
      (message.attachments as { storagePath: string }[]).map((file) => file.storagePath),
    );
    if (paths.length > 0) {
      await admin.storage.from('message-attachments').remove(paths);
    }

    const { data: photos } = await admin.storage.from('event-photos').list(id);
    if (photos && photos.length > 0) {
      await admin.storage.from('event-photos').remove(photos.map((photo) => `${id}/${photo.name}`));
    }
  }

  await admin.from('event_requests').delete().in('contact_email', TEST_EMAILS);

  const { data: users } = await admin.auth.admin.listUsers();
  for (const user of users?.users ?? []) {
    if (user.email?.startsWith(TEST_ACCOUNT_PREFIX)) {
      await admin.auth.admin.deleteUser(user.id);
    }
  }
}
