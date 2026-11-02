import type { EventRequest } from './request';

export interface AccountEvents {
  upcoming: EventRequest[];
  past: EventRequest[];
}

// Declined requests stay on record for the CRM but are not shown to the client. Dates are
// yyyy-MM-dd, so comparing the strings compares the days.
export function splitEvents(requests: readonly EventRequest[], today: string): AccountEvents {
  const visible = requests.filter((request) => request.status !== 'declined');
  const dateOf = (request: EventRequest) => request.event.date ?? '';
  return {
    upcoming: visible
      .filter((request) => dateOf(request) >= today)
      .sort((a, b) => dateOf(a).localeCompare(dateOf(b))),
    past: visible
      .filter((request) => dateOf(request) < today)
      .sort((a, b) => dateOf(b).localeCompare(dateOf(a))),
  };
}
