'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthNav } from '@/components/auth/AuthNav';
import { home } from '@/content/home';

const linkClass = 'inline-flex min-h-11 items-center text-[13px] tracking-[0.18em] uppercase no-underline';

// Three lines at the top right that open the menu, with the way into the private area.
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const { menu } = home;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={menu.open}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(true)}
        // White in difference mode reads on photos and turns dark on white pages.
        className="fixed top-4 right-4 z-40 flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-[6px] border-0 bg-transparent p-0 text-white mix-blend-difference md:top-6 md:right-8"
      >
        <span aria-hidden="true" className="block h-px w-7 bg-current" />
        <span aria-hidden="true" className="block h-px w-7 bg-current" />
        <span aria-hidden="true" className="block h-px w-7 bg-current" />
      </button>

      {open && (
        <div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label={menu.label}
          className="fixed inset-0 z-50 flex flex-col bg-bg px-6 py-6 text-ink md:px-8"
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="font-hand text-[40px] leading-none no-underline">
              {home.brand}
            </Link>
            <button
              type="button"
              aria-label={menu.close}
              onClick={() => setOpen(false)}
              className="h-11 w-11 cursor-pointer border-0 bg-transparent text-[28px] leading-none font-light text-ink"
            >
              ×
            </button>
          </div>
          <nav
            aria-label={menu.label}
            className="mt-16 flex flex-col gap-3"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) setOpen(false);
            }}
          >
            {menu.links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            <AuthNav linkClass={linkClass} />
          </nav>
        </div>
      )}
    </>
  );
}
