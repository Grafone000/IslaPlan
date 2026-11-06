import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bodoni_Moda, Jost, Nanum_Pen_Script } from 'next/font/google';
import './globals.css';

const jost = Jost({ subsets: ['latin'], variable: '--font-jost' });
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
});
// A free stand-in for Kendraw, the hand-drawn face chosen for the IslaPlan name.
const handScript = Nanum_Pen_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-hand-script',
});

export const metadata: Metadata = {
  title: 'IslaPlan',
  description: 'Plan your celebration at home.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jost.variable} ${bodoni.variable} ${handScript.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
