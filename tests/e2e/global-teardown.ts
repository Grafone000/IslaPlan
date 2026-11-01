import { createClient } from '@supabase/supabase-js';

// Removes requests made with the fixed test addresses, and their uploaded files. It runs after
// every test run, so nothing stays behind when a failed test restarts its worker.
export const TEST_EMAILS = [
  'estimate-e2e@example.com',
  'guest-e2e@example.com',
  'composer-e2e@example.com',
];

const BUCKET = 'message-attachments';

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
    const { data: messages } = await admin.from('event_messages').select('attachments').eq('request_id', id);
    const paths = (messages ?? []).flatMap((message) =>
      (message.attachments as { storagePath: string }[]).map((file) => file.storagePath),
    );
    if (paths.length > 0) {
      await admin.storage.from(BUCKET).remove(paths);
    }
  }

  await admin.from('event_requests').delete().in('contact_email', TEST_EMAILS);
}
