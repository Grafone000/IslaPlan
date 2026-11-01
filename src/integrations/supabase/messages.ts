import type { SupabaseClient } from '@supabase/supabase-js';
import type { AttachmentStore, EventMessage, MessageRepository } from '../contracts';

const TABLE = 'event_messages';
const BUCKET = 'message-attachments';
const SIGNED_URL_SECONDS = 60 * 60;

interface MessageRow {
  id: string;
  request_id: string;
  direction: EventMessage['direction'];
  subject: string;
  body: unknown;
  body_text: string;
  attachments: EventMessage['attachments'];
  created_at: string;
}

const fromRow = (row: MessageRow): EventMessage => ({
  id: row.id,
  requestId: row.request_id,
  direction: row.direction,
  subject: row.subject,
  body: row.body,
  bodyText: row.body_text,
  attachments: row.attachments,
  createdAt: row.created_at,
});

export function supabaseMessageRepository(admin: SupabaseClient): MessageRepository {
  return {
    async list(requestId) {
      const { data, error } = await admin
        .from(TABLE)
        .select('*')
        .eq('request_id', requestId)
        .order('created_at');
      if (error) throw error;
      return (data as MessageRow[]).map(fromRow);
    },

    async add(message) {
      const { data, error } = await admin
        .from(TABLE)
        .insert({
          id: message.id,
          request_id: message.requestId,
          direction: message.direction,
          subject: message.subject,
          body: message.body,
          body_text: message.bodyText,
          attachments: message.attachments,
        })
        .select('*')
        .single();
      if (error) throw error;
      return fromRow(data as MessageRow);
    },
  };
}

export function supabaseAttachmentStore(admin: SupabaseClient): AttachmentStore {
  return {
    async upload(path, file) {
      const { error } = await admin.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || 'application/octet-stream' });
      if (error) throw error;
    },

    async signedUrl(path) {
      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  };
}
