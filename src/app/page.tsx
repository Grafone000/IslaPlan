import { BookCta } from '@/components/home/BookCta';
import { Coordinate } from '@/components/home/Coordinate';
import { EventList } from '@/components/home/EventList';
import { Footer } from '@/components/home/Footer';
import { Hero } from '@/components/home/Hero';
import { SiteMenu } from '@/components/home/SiteMenu';
import { Story } from '@/components/home/Story';

export default function Home() {
  return (
    <>
      <SiteMenu />
      <main>
        <Hero />
        <Coordinate />
        <Story />
        <EventList />
        <BookCta />
      </main>
      <Footer />
    </>
  );
}
