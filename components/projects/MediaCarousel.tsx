import { MediaItem } from "@/lib/projects/types"
import { memo, useCallback, useEffect, useState } from "react"
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
  // For empty media array or single media item, just render it directly
  if (!media || media.length <= 1) {
    return (
      <div className="w-full mb-8">
        {media && media.length > 0 && (
          <MediaRenderer 
            item={media[0]} 
            title={title} 
            onClick={() => onMediaClick(0)} 
          />
        )}
      </div>
    );
  }
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // If there's a cover item, only show that one
  if (coverItem) {
    return (
      <div className="w-full mb-8">
        <MediaRenderer 
          item={coverItem} 
          title={title} 
          onClick={() => {
            // Find the index of the cover item to start lightbox at the right position
            const coverIndex = media.findIndex(item => item === coverItem);
            onMediaClick(coverIndex >= 0 ? coverIndex : 0);
          }} 
        />
      </div>
    );
  }
  
  // For multiple media items without a cover, implement carousel functionality
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Set up the rotation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [media.length]);
  
  return (
    <div className="w-full mb-8">
      <MediaRenderer 
        item={media[currentIndex]} 
        title={title} 
        onClick={() => onMediaClick(currentIndex)} 
      />
    </div>
  );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel; 