import type { SupabaseClient } from '@supabase/supabase-js';
import type { PhotoRepository } from '../contracts';

const BUCKET = 'event-photos';
const SIGNED_URL_SECONDS = 60 * 60;
const MAX_PHOTOS = 200;

// Staff upload into a folder named after the request id, so no table is needed.
export function supabasePhotoRepository(admin: SupabaseClient): PhotoRepository {
  return {
    async list(requestId) {
      const { data: files, error } = await admin.storage
        .from(BUCKET)
        .list(requestId, { limit: MAX_PHOTOS, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;

      const photos = files.filter((file) => !file.name.startsWith('.'));
      if (photos.length === 0) {
        return [];
      }

      const { data: signed, error: signError } = await admin.storage
        .from(BUCKET)
        .createSignedUrls(
          photos.map((photo) => `${requestId}/${photo.name}`),
          SIGNED_URL_SECONDS,
        );
      if (signError) throw signError;

      return photos.flatMap((photo, index) => {
        const url = signed[index].signedUrl;
        return url ? [{ name: photo.name, url }] : [];
      });
    },
  };
}
