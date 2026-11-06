import { format, parseISO, startOfToday } from 'date-fns';
import type { CSSProperties } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { wizardContent as content } from '@/content/wizard';
import type { EventDetails } from '@/domain/request';
import { earliestEventDate, formatEventDate } from '@/domain/dates';
import { endTimes, isValidEnd, startTimes } from '@/domain/wizard';

const NEXT_DAY_SUFFIX = '|next-day';

const selectClass =
  'min-h-12 w-full rounded-button border border-line bg-white px-3 text-base font-normal text-ink';

const calendarTheme = {
  '--rdp-accent-color': 'var(--color-accent)',
  '--rdp-accent-background-color': 'var(--color-surface)',
} as CSSProperties;

export function DateTimeStep({
  event,
  onChange,
}: {
  event: EventDetails;
  onChange(patch: Partial<EventDetails>): void;
}) {
  const { date, startTime, endTime, endsNextDay } = event;
  const today = startOfToday();
  // Days before the earliest date stay visible but cannot be picked.
  const earliest = parseISO(earliestEventDate(today));

  function changeStart(value: string) {
    const keepEnd = value !== '' && isValidEnd(value, endTime, endsNextDay);
    onChange({
      startTime: value || null,
      endTime: keepEnd ? endTime : null,
      endsNextDay: keepEnd ? endsNextDay : false,
    });
  }

  function changeEnd(value: string) {
    onChange({
      endTime: value.replace(NEXT_DAY_SUFFIX, '') || null,
      endsNextDay: value.endsWith(NEXT_DAY_SUFFIX),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mt-0 mb-2 text-[15px] font-medium">{content.dateTime.date}</p>
        <p className="mt-0 mb-3 text-[14px] text-muted">
          {content.dateTime.earliest(formatEventDate(format(earliest, 'yyyy-MM-dd')))}
        </p>
        <div className="w-fit max-w-full rounded-button border border-line bg-white p-2">
          <DayPicker
            mode="single"
            weekStartsOn={1}
            required={false}
            selected={date ? parseISO(date) : undefined}
            defaultMonth={date ? parseISO(date) : today}
            startMonth={today}
            disabled={{ before: earliest }}
            onSelect={(day) => onChange({ date: day ? format(day, 'yyyy-MM-dd') : null })}
            style={calendarTheme}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[15px] font-medium">
          {content.dateTime.start}
          <select
            className={selectClass}
            value={startTime ?? ''}
            onChange={(change) => changeStart(change.target.value)}
          >
            <option value="">{content.dateTime.placeholder}</option>
            {startTimes().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[15px] font-medium">
          {content.dateTime.end}
          <select
            className={selectClass}
            disabled={!startTime}
            value={endTime ? `${endTime}${endsNextDay ? NEXT_DAY_SUFFIX : ''}` : ''}
            onChange={(change) => changeEnd(change.target.value)}
          >
            <option value="">{content.dateTime.placeholder}</option>
            {startTime &&
              endTimes(startTime).map((slot) => (
                <option
                  key={`${slot.time}-${slot.endsNextDay}`}
                  value={`${slot.time}${slot.endsNextDay ? NEXT_DAY_SUFFIX : ''}`}
                >
                  {slot.endsNextDay ? `${slot.time} ${content.dateTime.nextDay}` : slot.time}
                </option>
              ))}
          </select>
        </label>
      </div>
    </div>
  );
}
