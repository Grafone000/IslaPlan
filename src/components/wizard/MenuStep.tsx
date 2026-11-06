import { wizardContent as content } from '@/content/wizard';
import type { Menu } from '@/domain/catalog';

interface Course {
  title: string | null;
  dishes: string[];
}

// A chef's dishes start with their course, "Starter: ...". Other menus are a single course.
function coursesOf(menu: Menu): Course[] {
  const courses: Course[] = [];
  for (const dish of menu.dishes) {
    const match = /^(Starter|Main|Dessert): (.*)$/.exec(dish);
    const title = match ? match[1] : null;
    const text = match ? match[2] : dish;
    const last = courses.at(-1);
    if (last && last.title === title) {
      last.dishes.push(text);
    } else {
      courses.push({ title, dishes: [text] });
    }
  }
  return courses;
}

// Each menu reads like a printed restaurant menu: script title, spaced courses, italic dishes.
export function MenuStep({
  menus,
  selected,
  onSelect,
}: {
  menus: readonly Menu[];
  selected: string | undefined;
  onSelect(id: string): void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {menus.map((menu) => {
        const isSelected = selected === menu.id;
        return (
          <button
            key={menu.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(menu.id)}
            className={`flex w-full cursor-pointer flex-col items-center gap-5 border bg-white px-6 py-9 text-center text-ink shadow-[0_1px_0_rgba(0,0,0,0.02)] ${
              isSelected ? 'border-accent outline outline-1 outline-accent' : 'border-line hover:border-accent'
            }`}
          >
            <span className="font-serif text-[40px] leading-none text-muted italic">
              {content.menuHeading}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[13px] font-medium tracking-[0.3em] uppercase">{menu.name}</span>
              <span className="font-serif text-[14px] text-muted italic">{menu.style}</span>
            </span>
            {coursesOf(menu).map((course, index) => (
              <span key={course.title ?? index} className="flex flex-col gap-1">
                {course.title && (
                  <span className="mb-1 text-[13px] tracking-[0.35em] uppercase">
                    {course.title}
                  </span>
                )}
                {course.dishes.map((dish) => (
                  <span key={dish} className="font-serif text-[15px] leading-snug text-muted italic">
                    {dish}
                  </span>
                ))}
              </span>
            ))}
            <span
              className={`mt-2 text-[12px] tracking-[0.2em] uppercase ${isSelected ? 'text-accent' : 'text-muted'}`}
            >
              {isSelected ? content.menuChosen : content.menuChoose}
            </span>
          </button>
        );
      })}
    </div>
  );
}
