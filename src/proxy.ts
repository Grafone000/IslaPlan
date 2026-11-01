import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { publicSupabaseConfig } from '@/integrations/supabase/config';

const PRIVATE_PREFIX = '/account';

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Keeps the Supabase session fresh and guards the private area.
export async function proxy(request: NextRequest) {
  const isPrivate = request.nextUrl.pathname.startsWith(PRIVATE_PREFIX);
  const config = publicSupabaseConfig();
  if (!config) {
    return isPrivate ? redirectToLogin(request) : NextResponse.next({ request });
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
  return !data.user && isPrivate ? redirectToLogin(request) : response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|favicon.ico).*)'],
};
