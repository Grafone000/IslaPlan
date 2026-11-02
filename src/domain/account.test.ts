import { describe, expect, it } from 'vitest';
import { splitEvents } from './account';
import { createDraft, type EventRequest, type RequestStatus } from './request';

const event = (id: string, date: string, status: RequestStatus = 'deposit-paid'): EventRequest => {
  const draft = createDraft(id, '2026-01-01T00:00:00.000Z');
  return { ...draft, status, event: { ...draft.event, date } };
};

const ids = (requests: EventRequest[]) => requests.map((request) => request.id);

describe('splitEvents', () => {
  const today = '2026-11-02';

  it('sorts upcoming events soonest first and past events latest first', () => {
    const { upcoming, past } = splitEvents(
      [
        event('later', '2027-06-01'),
        event('soon', '2026-12-01'),
        event('old', '2025-01-01'),
        event('recent', '2026-10-01'),
      ],
      today,
    );
    expect(ids(upcoming)).toEqual(['soon', 'later']);
    expect(ids(past)).toEqual(['recent', 'old']);
  });

  it('counts an event today as upcoming', () => {
    expect(ids(splitEvents([event('today', today)], today).upcoming)).toEqual(['today']);
  });

  it('hides declined requests', () => {
    const { upcoming, past } = splitEvents(
      [event('a', '2027-01-01', 'declined'), event('b', '2025-01-01', 'declined')],
      today,
    );
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  it('keeps every other status', () => {
    const statuses: RequestStatus[] = ['estimated', 'revising', 'accepted', 'deposit-pending'];
    const requests = statuses.map((status) => event(status, '2027-01-01', status));
    expect(splitEvents(requests, today).upcoming).toHaveLength(4);
  });
});
