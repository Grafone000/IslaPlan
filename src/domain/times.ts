import type { EventDetails, TimeSlot } from './request';

const SLOT_MINUTES = 30;
const FIRST_START = 10 * 60;
const LAST_START = 23 * 60;
const LAST_END = 26 * 60; // 02:00 the next day
const DAY = 24 * 60;

export interface SlotTime {
  time: string;
  nextDay: boolean;
}

const toTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60) % 24;
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

const toMinutes = (time: string, nextDay = false) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes + (nextDay ? DAY : 0);
};

const slotTime = (minutes: number): SlotTime => ({
  time: toTime(minutes),
  nextDay: minutes >= DAY,
});

export function startTimes(): string[] {
  const times: string[] = [];
  for (let minutes = FIRST_START; minutes <= LAST_START; minutes += SLOT_MINUTES) {
    times.push(toTime(minutes));
  }
  return times;
}

export function endTimes(startTime: string): { time: string; endsNextDay: boolean }[] {
  const times: { time: string; endsNextDay: boolean }[] = [];
  const first = toMinutes(startTime) + SLOT_MINUTES;
  for (let minutes = first; minutes <= LAST_END; minutes += SLOT_MINUTES) {
    times.push({ time: toTime(minutes), endsNextDay: minutes >= DAY });
  }
  return times;
}

export function isValidEnd(
  startTime: string,
  endTime: string | null,
  endsNextDay: boolean,
): boolean {
  return endTimes(startTime).some(
    (slot) => slot.time === endTime && slot.endsNextDay === endsNextDay,
  );
}

// A service such as the DJ runs inside the event, on the same 30-minute grid.
function eventWindow(event: EventDetails): [start: number, end: number] | null {
  if (!event.startTime || !event.endTime) {
    return null;
  }
  return [toMinutes(event.startTime), toMinutes(event.endTime, event.endsNextDay)];
}

export function wholeEventSlot(event: EventDetails): TimeSlot | null {
  const window = eventWindow(event);
  if (!window) {
    return null;
  }
  const [start, end] = window.map(slotTime);
  return {
    startTime: start.time,
    startsNextDay: start.nextDay,
    endTime: end.time,
    endsNextDay: end.nextDay,
  };
}

export function slotStartTimes(event: EventDetails): SlotTime[] {
  const window = eventWindow(event);
  if (!window) {
    return [];
  }
  const times: SlotTime[] = [];
  for (let minutes = window[0]; minutes < window[1]; minutes += SLOT_MINUTES) {
    times.push(slotTime(minutes));
  }
  return times;
}

export function slotEndTimes(event: EventDetails, start: SlotTime): SlotTime[] {
  const window = eventWindow(event);
  if (!window) {
    return [];
  }
  const times: SlotTime[] = [];
  for (
    let minutes = toMinutes(start.time, start.nextDay) + SLOT_MINUTES;
    minutes <= window[1];
    minutes += SLOT_MINUTES
  ) {
    times.push(slotTime(minutes));
  }
  return times;
}

export function isValidSlot(event: EventDetails, slot: TimeSlot): boolean {
  const start = { time: slot.startTime, nextDay: slot.startsNextDay };
  const same = (a: SlotTime) => a.time === start.time && a.nextDay === start.nextDay;
  return (
    slotStartTimes(event).some(same) &&
    slotEndTimes(event, start).some(
      (end) => end.time === slot.endTime && end.nextDay === slot.endsNextDay,
    )
  );
}
