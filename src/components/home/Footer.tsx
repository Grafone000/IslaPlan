import { home } from '@/content/home';

export function Footer() {
  const { copyright, contact } = home.footer;
  return (
    <footer className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-4 px-6 pt-10 pb-28 text-sm text-muted md:px-8">
      <span>{copyright}</span>
      <span>{contact}</span>
    </footer>
  );
}
