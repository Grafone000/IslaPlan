import { home } from '@/content/home';

export function Footer() {
  const { copyright, contact } = home.footer;
  return (
    <footer className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-4 px-4 py-10 text-[12px] tracking-[0.14em] text-muted uppercase md:px-8">
      <span>{copyright}</span>
      <span>{contact}</span>
    </footer>
  );
}
