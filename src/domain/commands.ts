import type { PricingConfig, EstimateInput } from './pricing/engine';
import { calculateEstimate } from './pricing/engine';
import type { PriceTable } from './pricing/table.v1';
import {
  createDraft,
  transition,
  type ConsultationMethod,
  type Contact,
  type DeclineStage,
  type Estimate,
  type EventDetails,
  type EventRequest,
  type Payment,
  type RequestStatus,
} from './request';

export type RequestCommand =
  | { type: 'accept-estimate' }
  | { type: 'reject-estimate' }
  | { type: 'request-consultation' }
  | { type: 'skip-consultation' }
  | { type: 'set-consultation-method'; method: ConsultationMethod }
  | { type: 'proceed' }
  | { type: 'decline' }
  | { type: 'change-event'; event: EventDetails };

export interface PricingContext {
  table: PriceTable;
  config: PricingConfig;
}

export class CommandNotAllowedError extends Error {
  constructor(type: string, status: RequestStatus) {
    super(`Command ${type} is not allowed in status ${status}`);
    this.name = 'CommandNotAllowedError';
  }
}

const declineStages: Partial<Record<RequestStatus, DeclineStage>> = {
  revising: 'estimate',
  accepted: 'proceed',
  'consultation-requested': 'proceed',
  'deposit-pending': 'deposit',
};

const openDecisions = {
  estimateAccepted: null,
  consultationWanted: null,
  proceed: null,
  declinedAt: null,
};

export function estimateInputOf(event: EventDetails): EstimateInput {
  return {
    eventType: event.type as EstimateInput['eventType'],
    partySize: event.partySize as EstimateInput['partySize'],
    food: event.food,
    drinks: event.drinks,
    entertainment: event.entertainment.items,
    decorations: event.decorations.items,
  };
}

function estimateFor(event: EventDetails, pricing: PricingContext): Estimate {
  return calculateEstimate(estimateInputOf(event), pricing.table, pricing.config);
}

// The server is the only caller, so the estimate is always its own calculation.
export function createEstimatedRequest(
  fields: { id: string; accountId: string | null; contact: Contact; event: EventDetails },
  pricing: PricingContext,
  at: string,
): EventRequest {
  const draft: EventRequest = {
    ...createDraft(fields.id, at),
    accountId: fields.accountId,
    contact: fields.contact,
    event: fields.event,
    estimate: estimateFor(fields.event, pricing),
  };
  return transition(draft, 'estimated', at);
}

export function applyCommand(
  request: EventRequest,
  command: RequestCommand,
  pricing: PricingContext,
  at: string,
): EventRequest {
  const notAllowed = () => new CommandNotAllowedError(command.type, request.status);
  const withDecisions = (next: EventRequest, decisions: Partial<EventRequest['decisions']>) => ({
    ...next,
    decisions: { ...next.decisions, ...decisions },
  });
  const touch = (next: EventRequest) => ({
    ...next,
    revision: next.revision + 1,
    updatedAt: at,
  });

  switch (command.type) {
    case 'accept-estimate':
      if (request.status !== 'estimated') throw notAllowed();
      return withDecisions(transition(request, 'accepted', at), { estimateAccepted: true });

    case 'reject-estimate':
      if (request.status !== 'estimated') throw notAllowed();
      return withDecisions(transition(request, 'revising', at), { estimateAccepted: false });

    case 'request-consultation':
      if (request.status !== 'accepted') throw notAllowed();
      return withDecisions(transition(request, 'consultation-requested', at), {
        consultationWanted: true,
      });

    case 'skip-consultation':
      if (request.status !== 'accepted') throw notAllowed();
      return touch(withDecisions(request, { consultationWanted: false }));

    case 'set-consultation-method':
      if (request.status !== 'consultation-requested') throw notAllowed();
      return touch({
        ...request,
        consultation: { ...request.consultation, method: command.method },
      });

    case 'proceed': {
      if (request.status !== 'accepted' && request.status !== 'consultation-requested') {
        throw notAllowed();
      }
      // A fully on-request event has no deposit: staff follow up from here.
      if (request.estimate?.kind === 'on-request') {
        return touch(withDecisions(request, { proceed: true }));
      }
      return withDecisions(transition(request, 'deposit-pending', at), { proceed: true });
    }

    case 'decline': {
      const stage = declineStages[request.status];
      if (!stage) throw notAllowed();
      return withDecisions(transition(request, 'declined', at), {
        proceed: stage === 'estimate' ? request.decisions.proceed : false,
        declinedAt: stage,
      });
    }

    case 'change-event': {
      if (request.status === 'draft') throw notAllowed();
      const previous = request.estimate;
      const next = transition(request, 'estimated', at);
      return {
        ...next,
        event: command.event,
        estimate: estimateFor(command.event, pricing),
        estimateHistory: previous
          ? [
              ...next.estimateHistory,
              {
                at,
                totalLow: previous.totalLow,
                totalHigh: previous.totalHigh,
                midpoint: previous.midpoint,
              },
            ]
          : next.estimateHistory,
        decisions: { ...openDecisions },
        consultation: { method: null, messageId: null },
      };
    }
  }
}

// Server only, once the consultation email is stored: clients cannot set a message id.
export function recordConsultationMessage(
  request: EventRequest,
  messageId: string,
  at: string,
): EventRequest {
  return {
    ...request,
    consultation: { method: 'email', messageId },
    revision: request.revision + 1,
    updatedAt: at,
  };
}

// Server only: the amount always comes from the stored estimate.
export function recordDepositPayment(
  request: EventRequest,
  payment: Pick<Payment, 'provider' | 'paymentId' | 'amount' | 'currency'>,
  at: string,
): EventRequest {
  return {
    ...request,
    payment: { ...payment, status: 'pending', paidAt: null },
    revision: request.revision + 1,
    updatedAt: at,
  };
}

export function recordPaymentOutcome(
  request: EventRequest,
  outcome: 'paid' | 'failed',
  at: string,
): EventRequest {
  const payment = request.payment as Payment;
  if (outcome === 'failed') {
    return {
      ...request,
      payment: { ...payment, status: 'failed' },
      revision: request.revision + 1,
      updatedAt: at,
    };
  }
  return {
    ...transition(request, 'deposit-paid', at),
    payment: { ...payment, status: 'paid', paidAt: at },
  };
}

const commandTypes = new Set<string>([
  'accept-estimate',
  'reject-estimate',
  'request-consultation',
  'skip-consultation',
  'set-consultation-method',
  'proceed',
  'decline',
  'change-event',
]);

export function isRequestCommand(
  value: unknown,
  isEvent: (event: unknown) => event is EventDetails,
): value is RequestCommand {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const command = value as Record<string, unknown>;
  if (typeof command.type !== 'string' || !commandTypes.has(command.type)) {
    return false;
  }
  if (command.type === 'set-consultation-method') {
    return command.method === 'phone' || command.method === 'email';
  }
  if (command.type === 'change-event') {
    return isEvent(command.event);
  }
  return true;
}
