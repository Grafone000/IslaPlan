import type { RequestCommand } from '@/domain/commands';
import type { Contact, EventDetails, EventRequest } from '@/domain/request';

async function send(url: string, method: string, body: unknown): Promise<EventRequest> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const { request } = (await response.json()) as { request: EventRequest };
  return request;
}

export const requestsApi = {
  create(input: { id: string; contact: Contact; event: EventDetails }) {
    return send('/api/requests', 'POST', input);
  },
  command(id: string, command: RequestCommand) {
    return send(`/api/requests/${id}`, 'PATCH', command);
  },
  async sendMessage(
    id: string,
    message: { subject: string; body: unknown },
    files: File[],
  ): Promise<EventRequest> {
    const form = new FormData();
    form.append('message', JSON.stringify(message));
    files.forEach((file) => form.append('files', file));
    const response = await fetch(`/api/requests/${id}/messages`, { method: 'POST', body: form });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const { request } = (await response.json()) as { request: EventRequest };
    return request;
  },
};
