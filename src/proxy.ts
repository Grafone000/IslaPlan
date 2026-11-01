import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { publicSupabaseConfig } from '@/integrations/supabase/config';

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Guards the private area and keeps its Supabase session fresh.
export async function proxy(request: NextRequest) {
  const config = publicSupabaseConfig();
  if (!config) {
    return redirectToLogin(request);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user ? response : redirectToLogin(request);
}

// Only the private area: the browser client keeps the session fresh everywhere else, and a
// Supabase round trip on every page would slow down the wizard.
export const config = {
  matcher: ['/account/:path*'],
};
