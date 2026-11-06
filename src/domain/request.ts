import type {
  BottleKind,
  CocktailDrink,
  DecorationId,
  DrinksId,
  EntertainmentId,
  EventTypeId,
  FoodId,
  GlassSizeId,
  MenuFood,
  PartySizeId,
  PricedCategory,
  TimedDrink,
  TimedEntertainment,
} from './catalog';

export const SCHEMA_VERSION = 3;

export const requestStatuses = [
  'draft',
  'estimated',
  'revising',
  'declined',
  'accepted',
  'consultation-requested',
  'deposit-pending',
  'deposit-paid',
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

// Single source of truth for the status flow. The estimated -> estimated edge is a
// re-estimate after an answer changes; declined and deposit-paid are final.
export const statusTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  draft: ['estimated'],
  estimated: ['estimated', 'revising', 'accepted'],
  revising: ['estimated', 'declined'],
  accepted: ['estimated', 'consultation-requested', 'deposit-pending', 'declined'],
  'consultation-requested': ['estimated', 'deposit-pending', 'declined'],
  'deposit-pending': ['estimated', 'deposit-paid', 'declined'],
  declined: [],
  'deposit-paid': [],
};

export type EstimateKind = 'priced' | 'partial' | 'on-request';
export type DeclineStage = 'estimate' | 'proceed' | 'deposit';
export type ConsultationMethod = 'phone' | 'email';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Times of a service inside the event, such as the DJ. The flags mark times after midnight.
export interface TimeSlot {
  startTime: string;
  startsNextDay: boolean;
  endTime: string;
  endsNextDay: boolean;
}

export interface FoodChoice {
  items: FoodId[];
  // Menu id per chosen food that has menus.
  menus: Partial<Record<MenuFood, string>>;
  ownFoodNote: string | null;
}

// A bottle chosen for Wine only, with how it is poured and how many bottles.
export interface WineBottle {
  product: string;
  glass: GlassSizeId;
  quantity: number;
}

// The bottle that comes with a Drinks all package, one kind for every guest.
export interface DrinksAllBottle {
  kind: BottleKind;
  product: string | null;
}

export interface DrinksChoice {
  items: DrinksId[];
  // Cocktails per guest for each chosen cocktail drink.
  packages: Partial<Record<CocktailDrink, string>>;
  drinksAllBottle: DrinksAllBottle | null;
  wineBottles: WineBottle[];
  times: Partial<Record<TimedDrink, TimeSlot>>;
  ownDrinksNote: string | null;
}

export interface EntertainmentChoice {
  items: EntertainmentId[];
  times: Partial<Record<TimedEntertainment, TimeSlot>>;
  activitiesPreference: string | null;
}

export interface EventDetails {
  type: EventTypeId | null;
  typeNote: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  endsNextDay: boolean;
  partySize: PartySizeId | null;
  food: FoodChoice;
  drinks: DrinksChoice;
  entertainment: EntertainmentChoice;
  decorations: { items: DecorationId[]; note: string | null };
  additionalInfo: string;
  // Pence. The slider's top value means "or more".
  budget: number | null;
}

export interface EstimateLine {
  category: PricedCategory;
  item: string;
  lowPerPerson: number;
  highPerPerson: number;
}

// Bottles priced by the bottle rather than per person. Quantities follow the guest range
// for Drinks all and are chosen by the client for Wine only.
export interface BottleLine {
  item: 'wine-only' | 'drinks-all';
  product: string;
  pricePerBottle: number;
  quantityLow: number;
  quantityHigh: number;
  amountLow: number;
  amountHigh: number;
}

export interface EstimateItemRef {
  category: PricedCategory;
  item: string;
}

// All amounts are integer pence. Totals and the deposit are null when kind is on-request.
export interface Estimate {
  kind: EstimateKind;
  pricingVersion: string;
  currency: string;
  guestsMin: number;
  guestsMax: number;
  lines: EstimateLine[];
  bottleLines: BottleLine[];
  onRequestItems: EstimateItemRef[];
  totalLow: number | null;
  totalHigh: number | null;
  midpoint: number | null;
  depositPercent: number;
  depositAmount: number | null;
}

export interface EstimateSnapshot {
  at: string;
  totalLow: number | null;
  totalHigh: number | null;
  midpoint: number | null;
}

export interface Decisions {
  estimateAccepted: boolean | null;
  consultationWanted: boolean | null;
  proceed: boolean | null;
  declinedAt: DeclineStage | null;
}

export interface Consultation {
  method: ConsultationMethod | null;
  messageId: string | null;
}

export interface Payment {
  provider: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface StatusChange {
  status: RequestStatus;
  at: string;
}

export interface EventRequest {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  revision: number;
  status: RequestStatus;
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
  accountId: string | null;
  contact: Contact | null;
  event: EventDetails;
  estimate: Estimate | null;
  estimateHistory: EstimateSnapshot[];
  decisions: Decisions;
  consultation: Consultation;
  payment: Payment | null;
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: RequestStatus,
    readonly to: RequestStatus,
  ) {
    super(`Invalid request status transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return statusTransitions[from].includes(to);
}

export function isFinalStatus(status: RequestStatus): boolean {
  return statusTransitions[status].length === 0;
}

export type EstimateStage = 'accept' | 'revise' | 'consultation' | 'proceed' | 'deposit' | 'closed';

// Which question the client is on, worked out from the saved request so a reload or a return
// from a phone call lands on the same screen.
export function estimateStage(request: EventRequest): EstimateStage {
  const { status, decisions } = request;
  if (isFinalStatus(status)) {
    return 'closed';
  }
  // Requests saved before deposits were dropped can still be waiting for one.
  if (status === 'deposit-pending') {
    return 'deposit';
  }
  // Saying yes to proceeding ends the client's part: staff get in touch, with no deposit.
  if (decisions.proceed) {
    return 'closed';
  }
  switch (status) {
    case 'revising':
      return 'revise';
    case 'accepted':
      return decisions.consultationWanted === null ? 'consultation' : 'proceed';
    case 'consultation-requested':
      return 'proceed';
    default:
      return 'accept';
  }
}

export function transition(request: EventRequest, to: RequestStatus, at: string): EventRequest {
  if (!canTransition(request.status, to)) {
    throw new InvalidTransitionError(request.status, to);
  }
  return {
    ...request,
    status: to,
    statusHistory: [...request.statusHistory, { status: to, at }],
    revision: request.revision + 1,
    updatedAt: at,
  };
}

export function createDraft(id: string, at: string): EventRequest {
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    revision: 1,
    status: 'draft',
    statusHistory: [{ status: 'draft', at }],
    createdAt: at,
    updatedAt: at,
    accountId: null,
    contact: null,
    event: {
      type: null,
      typeNote: null,
      date: null,
      startTime: null,
      endTime: null,
      endsNextDay: false,
      partySize: null,
      food: { items: [], menus: {}, ownFoodNote: null },
      drinks: {
        items: [],
        packages: {},
        drinksAllBottle: null,
        wineBottles: [],
        times: {},
        ownDrinksNote: null,
      },
      entertainment: { items: [], times: {}, activitiesPreference: null },
      decorations: { items: [], note: null },
      additionalInfo: '',
      budget: null,
    },
    estimate: null,
    estimateHistory: [],
    decisions: {
      estimateAccepted: null,
      consultationWanted: null,
      proceed: null,
      declinedAt: null,
    },
    consultation: { method: null, messageId: null },
    payment: null,
  };
}
