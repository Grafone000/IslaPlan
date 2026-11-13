// The big name on the first slide. It fades away as the slide leaves: the opacity follows
// the --leave value that HomeSlides sets on the slide.
export function HeroName({ name }: { name: string }) {
  return (
    <h1 className="home-fade m-0 font-display text-[clamp(72px,17vw,280px)] leading-[0.85] font-normal tracking-[-0.03em]">
      {name}
    </h1>
  );
}
