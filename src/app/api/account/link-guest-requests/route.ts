import { linkGuestRequestsForSession } from '@/integrations/server';

export async function POST() {
  await linkGuestRequestsForSession();
  return new Response(null, { status: 204 });
}
