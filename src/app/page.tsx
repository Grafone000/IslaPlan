import { BookCta } from '@/components/home/BookCta';
import { Coordinate } from '@/components/home/Coordinate';
import { EventList } from '@/components/home/EventList';
import { Hero } from '@/components/home/Hero';
import { HomeSlides } from '@/components/home/HomeSlides';
import { SiteMenu } from '@/components/home/SiteMenu';
import { Story } from '@/components/home/Story';
import { home } from '@/content/home';

const { slides } = home;

export default function Home() {
  return (
    <>
      <SiteMenu />
      <main>
        <HomeSlides
          slides={[
            { id: 'top', label: slides.hero, content: <Hero /> },
            {
              id: 'coordinate',
              label: slides.coordinate,
              content: <Coordinate />,
            },
            { id: 'story', label: slides.story, content: <Story /> },
            { id: 'events', label: slides.events, content: <EventList /> },
            { id: 'book', label: slides.book, content: <BookCta /> },
          ]}
        />
      </main>
    </>
  );
}
