import { BookBand } from '@/components/home/BookBand';
import { Celebrate } from '@/components/home/Celebrate';
import { Choices } from '@/components/home/Choices';
import { Experiences } from '@/components/home/Experiences';
import { Footer } from '@/components/home/Footer';
import { Hero } from '@/components/home/Hero';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Celebrate />
        <Experiences />
        <Choices />
        <BookBand />
      </main>
      <Footer />
    </>
  );
}
