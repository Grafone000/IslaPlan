import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/domain/validation';
import { sessionClient } from '@/integrations/server';

// Supabase email links land here, then continue to the page they were meant for.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  if (code) {
    const supabase = await sessionClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNextPath(searchParams.get('next')), origin));
}
