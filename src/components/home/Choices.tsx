import { home } from '@/content/home';

export function Choices() {
  const { title, paragraphs } = home.choices;
  return (
    <section id="choices" className="mx-auto max-w-[1100px] px-6 py-28 text-center md:px-8">
      <h2 className="m-0 font-display text-[clamp(42px,5vw,72px)] leading-[1.05] font-normal">
        {title}
      </h2>
      <div className="mx-auto mt-10 flex max-w-[760px] flex-col gap-5 text-muted">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="m-0">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
