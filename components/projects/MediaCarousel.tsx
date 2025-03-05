import { MediaItem } from "@/lib/projects/types"
import { memo, useCallback } from "react"
import MediaRenderer from "./MediaRenderer"

interface MediaCarouselProps {
  media: MediaItem[]
  title: string
  onMediaClick: (index: number) => void
}

export const MediaCarousel = memo(({ 
  media, 
  title, 
  onMediaClick 
}: MediaCarouselProps) => {
  // For single media item, just render it directly
  if (media.length <= 1) {
    return (
      <div className="w-full mb-8">
        <MediaRenderer 
          item={media[0]} 
          title={title} 
          onClick={() => onMediaClick(0)} 
        />
      </div>
    );
  }
  
  // For multiple media items, just show the first one (typically the cover)
  // We'll rely on the lightbox for navigation between items
  return (
    <div className="w-full mb-8">
      <MediaRenderer 
        item={media[0]} 
        title={title} 
        onClick={() => onMediaClick(0)} 
      />
    </div>
  );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel; 