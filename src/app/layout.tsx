import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, DM_Serif_Display, Italiana, Jost } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
});
const italiana = Italiana({ subsets: ['latin'], weight: '400', variable: '--font-italiana' });
const jost = Jost({ subsets: ['latin'], variable: '--font-jost' });

export const metadata: Metadata = {
  title: 'Event Planner',
  description: 'Plan your celebration at home.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerif.variable} ${italiana.variable} ${jost.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
