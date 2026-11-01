import { createClient } from '@supabase/supabase-js';

// Removes requests made with the fixed test addresses. It runs after every test run, so
// nothing stays behind when a failed test restarts its worker.
export const TEST_EMAILS = ['estimate-e2e@example.com', 'guest-e2e@example.com'];

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
  await admin.from('event_requests').delete().in('contact_email', TEST_EMAILS);
}
