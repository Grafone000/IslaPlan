import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventRequest } from '@/domain/request';
import type { RequestRepository } from '../contracts';

const TABLE = 'event_requests';

function toRow(request: EventRequest) {
  return {
    id: request.id,
    schema_version: request.schemaVersion,
    revision: request.revision,
    status: request.status,
    account_id: request.accountId,
    contact_email: (request.contact?.email ?? '').trim().toLowerCase(),
    event_date: request.event.date,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
    payload: request,
  };
}

export function supabaseRequestRepository(admin: SupabaseClient): RequestRepository {
  const update: RequestRepository['update'] = async (request, expectedRevision) => {
    const { data, error } = await admin
      .from(TABLE)
      .update(toRow(request))
      .eq('id', request.id)
      .eq('revision', expectedRevision)
      .select('id');
    if (error) throw error;
    return data.length === 1;
  };

  return {
    update,

    async create(request) {
      const { error } = await admin.from(TABLE).insert(toRow(request));
      if (error) throw error;
    },

    async get(id) {
      const { data, error } = await admin.from(TABLE).select('payload').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data?.payload as EventRequest | undefined) ?? null;
    },

    async listByAccount(accountId) {
      const { data, error } = await admin
        .from(TABLE)
        .select('payload')
        .eq('account_id', accountId)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data.map((row) => row.payload as EventRequest);
    },

    async linkGuestRequests(accountId, email) {
      const { data, error } = await admin
        .from(TABLE)
        .select('payload')
        .is('account_id', null)
        .eq('contact_email', email.trim().toLowerCase());
      if (error) throw error;
      for (const row of data) {
        const request = row.payload as EventRequest;
        const linked = { ...request, accountId, revision: request.revision + 1 };
        await update(linked, request.revision);
      }
    },
  };
}
