import Image from 'next/image';
import { accountContent } from '@/content/account';
import type { EventPhoto } from '@/integrations/contracts';

export function PhotoGallery({ photos }: { photos: EventPhoto[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((photo) => (
        <a
          key={photo.name}
          href={photo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-square overflow-hidden rounded-button"
        >
          {/* Signed URLs expire, so they skip the image optimiser and its cache. */}
          <Image
            src={photo.url}
            alt={accountContent.photos.alt(photo.name)}
            fill
            unoptimized
            className="object-cover"
          />
        </a>
      ))}
    </div>
  );
}
