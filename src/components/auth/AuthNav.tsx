'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authContent } from '@/content/auth';
import { home } from '@/content/home';
import { auth } from '@/integrations';

const defaultLinkClass = 'inline-flex min-h-11 items-center no-underline';

export function AuthNav({ linkClass = defaultLinkClass }: { linkClass?: string }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    void auth.currentAccount().then((account) => {
      if (active) setLoggedIn(account !== null);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loggedIn) {
    return (
      <Link href={home.menu.logIn.href} className={linkClass}>
        {home.menu.logIn.label}
      </Link>
    );
  }

  return (
    <>
      <Link href={authContent.nav.accountHref} className={linkClass}>
        {authContent.nav.account}
      </Link>
      <button
        type="button"
        className={`${linkClass} cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit`}
        onClick={async () => {
          await auth.logout();
          setLoggedIn(false);
          router.refresh();
        }}
      >
        {authContent.nav.logOut}
      </button>
    </>
  );
}
