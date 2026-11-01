import { describe, expect, it } from 'vitest';
import {
  InvalidTransitionError,
  SCHEMA_VERSION,
  canTransition,
  createDraft,
  isFinalStatus,
  requestStatuses,
  statusTransitions,
  transition,
  type EventRequest,
  type RequestStatus,
} from './request';

const T0 = '2026-11-01T10:00:00.000Z';
const T1 = '2026-11-01T10:05:00.000Z';

const expectedEdges: [RequestStatus, RequestStatus][] = [
  ['draft', 'estimated'],
  ['estimated', 'estimated'],
  ['estimated', 'revising'],
  ['estimated', 'accepted'],
  ['revising', 'estimated'],
  ['revising', 'declined'],
  ['accepted', 'estimated'],
  ['accepted', 'consultation-requested'],
  ['accepted', 'deposit-pending'],
  ['accepted', 'declined'],
  ['consultation-requested', 'estimated'],
  ['consultation-requested', 'deposit-pending'],
  ['consultation-requested', 'declined'],
  ['deposit-pending', 'estimated'],
  ['deposit-pending', 'deposit-paid'],
  ['deposit-pending', 'declined'],
];

const inStatus = (status: RequestStatus): EventRequest => ({ ...createDraft('id', T0), status });

describe('status transitions', () => {
  it('allows exactly the agreed edges', () => {
    const actual = requestStatuses.flatMap((from) =>
      statusTransitions[from].map((to): [RequestStatus, RequestStatus] => [from, to]),
    );
    expect(actual.sort()).toEqual([...expectedEdges].sort());
  });

  it('has every status as a key', () => {
    expect(Object.keys(statusTransitions).sort()).toEqual([...requestStatuses].sort());
  });

  it('treats only declined and deposit-paid as final', () => {
    expect(requestStatuses.filter(isFinalStatus)).toEqual(['declined', 'deposit-paid']);
  });

  it('never lets a request decline straight from estimated', () => {
    expect(canTransition('estimated', 'declined')).toBe(false);
  });

  it('never reaches deposit-paid without deposit-pending', () => {
    const sources = requestStatuses.filter((from) => canTransition(from, 'deposit-paid'));
    expect(sources).toEqual(['deposit-pending']);
  });
});

describe('transition', () => {
  it('records the change and bumps the revision', () => {
    const next = transition(createDraft('id', T0), 'estimated', T1);
    expect(next.status).toBe('estimated');
    expect(next.revision).toBe(2);
    expect(next.updatedAt).toBe(T1);
    expect(next.statusHistory).toEqual([
      { status: 'draft', at: T0 },
      { status: 'estimated', at: T1 },
    ]);
  });

  it('does not mutate the original request', () => {
    const draft = createDraft('id', T0);
    const before = structuredClone(draft);
    transition(draft, 'estimated', T1);
    expect(draft).toEqual(before);
  });

  it('rejects an invalid transition', () => {
    expect(() => transition(createDraft('id', T0), 'deposit-paid', T1)).toThrow(
      InvalidTransitionError,
    );
  });

  it.each(['declined', 'deposit-paid'] as const)('rejects any change from %s', (status) => {
    for (const to of requestStatuses) {
      expect(() => transition(inStatus(status), to, T1)).toThrow(InvalidTransitionError);
    }
  });
});

describe('createDraft', () => {
  it('starts empty, versioned and in draft', () => {
    const draft = createDraft('id', T0);
    expect(draft.schemaVersion).toBe(SCHEMA_VERSION);
    expect(draft.status).toBe('draft');
    expect(draft.revision).toBe(1);
    expect(draft.contact).toBeNull();
    expect(draft.estimate).toBeNull();
    expect(draft.payment).toBeNull();
  });

  it('survives a JSON round trip unchanged', () => {
    const draft = createDraft('id', T0);
    expect(JSON.parse(JSON.stringify(draft))).toEqual(draft);
  });
});
