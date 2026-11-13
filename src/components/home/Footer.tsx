import { home } from '@/content/home';

export function Footer() {
  const { copyright, contact } = home.footer;
  return (
    <footer className="relative flex flex-wrap justify-between gap-4 px-4 pb-5 text-[11px] tracking-[0.14em] text-white/85 uppercase md:px-8">
      <span>{copyright}</span>
      <span>{contact}</span>
    </footer>
  );
}
