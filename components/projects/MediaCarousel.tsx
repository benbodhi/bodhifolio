import { MediaItem } from "@/lib/projects/types"
import { memo, useCallback, useEffect, useState, useRef } from "react"
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
  
  // For multiple media items without a cover, implement simple carousel
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Set up the rotation interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set new interval
    intervalRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % media.length);
    }, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [media.length]);
  
  return (
    <div className="w-full mb-8 relative">
      {media.map((item, index) => (
        <div 
          key={`${item.type}-${item.src}-${index}`}
          className="transition-opacity duration-1000"
          style={{ 
            opacity: index === activeIndex ? 1 : 0,
            zIndex: index === activeIndex ? 2 : 1,
            position: index === activeIndex ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            display: index === activeIndex || index === (activeIndex - 1 + media.length) % media.length ? 'block' : 'none'
          }}
        >
          <MediaRenderer 
            item={item} 
            title={title} 
            onClick={() => onMediaClick(index)} 
          />
        </div>
      ))}
    </div>
  );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel; 