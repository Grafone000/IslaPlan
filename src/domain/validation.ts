import {
  budgetBands,
  decorationOptions,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodOptions,
  partySizes,
  type CatalogOption,
} from './catalog';
import type { Contact, EventDetails } from './request';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;
const MAX_NOTE_LENGTH = 2000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;

const isOptionalNote = (value: unknown) => value === null || isText(value, MAX_NOTE_LENGTH);

const isOption = (value: unknown, options: readonly CatalogOption[]) =>
  options.some((option) => option.id === value);

function isSelection(value: unknown, options: readonly CatalogOption[]): boolean {
  if (!Array.isArray(value) || new Set(value).size !== value.length) {
    return false;
  }
  const selected = options.filter((option) => value.includes(option.id));
  return (
    selected.length === value.length &&
    selected.every((option) => !option.excludes?.some((id) => value.includes(id)))
  );
}

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

// Only same-site paths: "//evil.example" and "/\evil.example" would leave the site.
export function safeNextPath(value: string | null | undefined): string {
  return value && /^\/(?![/\\])/.test(value) ? value : '/';
}

export const isEmail =(value: string) => EMAIL_PATTERN.test(value.trim());

export const isPhone = (value: string) => PHONE_PATTERN.test(value.trim());

export function isContact(value: unknown): value is Contact {
  return (
    isRecord(value) &&
    isText(value.firstName, MAX_NAME_LENGTH) &&
    value.firstName.trim() !== '' &&
    isText(value.lastName, MAX_NAME_LENGTH) &&
    value.lastName.trim() !== '' &&
    typeof value.email === 'string' &&
    isEmail(value.email) &&
    typeof value.phone === 'string' &&
    isPhone(value.phone)
  );
}

function isCalendarDate(value: unknown): boolean {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function hasValidTimes(event: Record<string, unknown>): boolean {
  const { startTime, endTime, endsNextDay } = event;
  if (
    typeof startTime !== 'string' ||
    typeof endTime !== 'string' ||
    !TIME_PATTERN.test(startTime) ||
    !TIME_PATTERN.test(endTime) ||
    typeof endsNextDay !== 'boolean'
  ) {
    return false;
  }
  return endsNextDay ? endTime <= '02:00' : endTime > startTime;
}

// A finished event: every required answer is present and every id is known.
export function isCompleteEvent(value: unknown): value is EventDetails {
  if (!isRecord(value)) {
    return false;
  }
  const { entertainment, decorations } = value;
  return (
    isOption(value.type, eventTypes) &&
    isOptionalNote(value.typeNote) &&
    isCalendarDate(value.date) &&
    hasValidTimes(value) &&
    isOption(value.partySize, partySizes) &&
    isSelection(value.food, foodOptions) &&
    (value.food as unknown[]).length > 0 &&
    isSelection(value.drinks, drinksOptions) &&
    (value.drinks as unknown[]).length > 0 &&
    isRecord(entertainment) &&
    isSelection(entertainment.items, entertainmentOptions) &&
    isOptionalNote(entertainment.activitiesPreference) &&
    isRecord(decorations) &&
    isSelection(decorations.items, decorationOptions) &&
    isOptionalNote(decorations.note) &&
    isText(value.additionalInfo, MAX_NOTE_LENGTH) &&
    isOption(value.budget, budgetBands)
  );
}
