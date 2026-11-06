import { addMonths, format, parseISO } from 'date-fns';

// "14 May 2027": the long British form, for event dates stored as yyyy-MM-dd.
export function formatEventDate(date: string | null): string {
  return date ? format(parseISO(date), 'd MMMM yyyy') : '';
}

// "2 Nov 2026", for message timestamps.
export function formatShortDate(timestamp: string): string {
  return format(parseISO(timestamp), 'd MMM yyyy');
}

// Events are booked at least a month ahead: the first date a client may pick, as yyyy-MM-dd.
export function earliestEventDate(today: Date): string {
  return format(addMonths(today, 1), 'yyyy-MM-dd');
}
