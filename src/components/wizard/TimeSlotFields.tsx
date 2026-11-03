import { wizardContent as content } from '@/content/wizard';
import type { EventDetails, TimeSlot } from '@/domain/request';
import { slotEndTimes, slotStartTimes, type SlotTime } from '@/domain/times';

const NEXT_DAY_SUFFIX = '|next-day';

const selectClass =
  'min-h-12 w-full rounded-button border border-line bg-white px-3 text-base font-normal text-ink';

const encode = (slot: SlotTime) => `${slot.time}${slot.nextDay ? NEXT_DAY_SUFFIX : ''}`;

const decode = (value: string): SlotTime => ({
  time: value.replace(NEXT_DAY_SUFFIX, ''),
  nextDay: value.endsWith(NEXT_DAY_SUFFIX),
});

const optionText = (slot: SlotTime) =>
  slot.nextDay ? `${slot.time} ${content.slot.nextDay}` : slot.time;

// Start and end of a service, such as the DJ, within the hours of the event.
export function TimeSlotFields({
  label,
  event,
  slot,
  onChange,
}: {
  label: string;
  event: EventDetails;
  slot: TimeSlot;
  onChange(slot: TimeSlot): void;
}) {
  const start = { time: slot.startTime, nextDay: slot.startsNextDay };
  const ends = slotEndTimes(event, start);

  function changeStart(value: string) {
    const next = decode(value);
    const validEnds = slotEndTimes(event, next);
    const keep = validEnds.find(
      (end) => end.time === slot.endTime && end.nextDay === slot.endsNextDay,
    );
    const end = keep ?? validEnds[validEnds.length - 1];
    onChange({
      startTime: next.time,
      startsNextDay: next.nextDay,
      endTime: end.time,
      endsNextDay: end.nextDay,
    });
  }

  function changeEnd(value: string) {
    const end = decode(value);
    onChange({ ...slot, endTime: end.time, endsNextDay: end.nextDay });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-[15px] font-medium">
        {content.slot.start}
        <select
          aria-label={content.slot.label(label, content.slot.start)}
          className={selectClass}
          value={encode(start)}
          onChange={(change) => changeStart(change.target.value)}
        >
          {slotStartTimes(event).map((time) => (
            <option key={encode(time)} value={encode(time)}>
              {optionText(time)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium">
        {content.slot.end}
        <select
          aria-label={content.slot.label(label, content.slot.end)}
          className={selectClass}
          value={encode({ time: slot.endTime, nextDay: slot.endsNextDay })}
          onChange={(change) => changeEnd(change.target.value)}
        >
          {ends.map((time) => (
            <option key={encode(time)} value={encode(time)}>
              {optionText(time)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
