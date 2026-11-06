import type { ReactNode } from 'react';

// A template remounts on every step, so each new page turns in like a magazine page.
export default function PlanTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="page-turn-stage">
      <div className="page-turn">{children}</div>
    </div>
  );
}
