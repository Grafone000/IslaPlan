import type { CrmGateway } from '../contracts';

// The request is already stored in event_requests. The CRM plugs its notifications in here.
export const stubCrmGateway: CrmGateway = {
  async submitRequest() {
    return { ok: true };
  },
};
