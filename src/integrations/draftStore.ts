import { parseDraft, type WizardState } from '@/domain/wizard';

const KEY = 'event-planner:draft:v1';

// Storage can be missing or blocked: the wizard still works, it just will not resume.
export const draftStore = {
  load(): WizardState | null {
    try {
      return parseDraft(window.localStorage.getItem(KEY));
    } catch {
      return null;
    }
  },
  save(state: WizardState): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Nothing to do: see above.
    }
  },
};
