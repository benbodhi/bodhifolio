import Image from "next/image"
import { MediaItem } from "@/lib/projects/types"
import { memo, useCallback, useEffect, useRef, useState } from "react"

// Function to format video URLs for embedding
const formatVideoUrl = (url: string): string => {
  // Handle YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Extract video ID
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URL(url).searchParams;
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
  }
  
  // Handle Vimeo URLs
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
    if (vimeoId) {
      // Add parameters to control the player appearance
      return `https://player.vimeo.com/video/${vimeoId}?transparent=0&responsive=1&autoplay=0&controls=1&portrait=0&byline=0&title=0&dnt=1`;
    }
  }
  
  // Return original URL if no formatting needed or as fallback
  return url;
};

// Video renderer component
const VideoRenderer = memo(({ 
  src, 
  title,
  onClick 
}: { 
  src: string; 
  title: string;
  onClick?: () => void;
}) => {
  // Format the video URL once and store it
  const formattedUrl = useRef(formatVideoUrl(src));
  
  // Use state to control when the iframe is actually rendered
  const [shouldRender, setShouldRender] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // State to store video dimensions
  const [aspectRatio, setAspectRatio] = useState('16 / 9'); // Default aspect ratio
  
  // Determine if this is a Vimeo or YouTube video
  const isVimeo = src.includes('vimeo.com');
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  
  // Lazy load the iframe
  useEffect(() => {
    // Only attempt to load if not already errored
    if (hasError) return;
    
    // Small delay to ensure the component is mounted before loading the iframe
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 300); // Increased delay for better stability
    
    return () => clearTimeout(timer);
  }, [hasError]);
  
  // Handle iframe load errors
  const handleError = useCallback(() => {
    setHasError(true);
    setShouldRender(false);
  }, []);
  
  // Handle placeholder click
  const handlePlaceholderClick = useCallback(() => {
    setShouldRender(true);
  }, []);
  
  // Handle lightbox button click
  const handleLightboxClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);
  
  // Handle pop-out button click
  const handlePopOutClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(src, '_blank', 'noopener,noreferrer');
  }, [src]);
  
  // Set aspect ratio based on video source
  useEffect(() => {
    // YouTube videos are typically 16:9
    if (isYouTube) {
      setAspectRatio('16 / 9');
    }
    // Vimeo videos can be various aspect ratios, but we'll use 16:9 as default
    // In a production app, you could fetch the video metadata from Vimeo API
    else if (isVimeo) {
      setAspectRatio('16 / 9');
    }
  }, [isYouTube, isVimeo]);
  
  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
      {hasError ? (
        // Error state
        <div className="absolute inset-0 w-full h-full rounded-lg bg-[hsl(var(--border))] flex flex-col items-center justify-center">
          <div className="text-[hsl(var(--foreground))] opacity-70 mb-2">Video could not be loaded</div>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm"
          >
            Open video in new tab
          </a>
        </div>
      ) : shouldRender ? (
        // Actual iframe when ready to render with control buttons
        <div className="w-full h-0 relative" style={{ paddingBottom: 'calc(100% / (16/9))', aspectRatio }}>
          <iframe
            ref={iframeRef}
            src={formattedUrl.current}
            className="absolute inset-0 w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
            title={title || "Embedded video"}
            onError={handleError}
            style={{ 
              width: '100%', 
              height: '100%',
              border: 'none',
              objectFit: 'contain'
            }}
          ></iframe>
          
          {/* Control buttons in top-right corner */}
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            {/* Lightbox/expand button */}
            {onClick && (
              <button 
                className="bg-black/70 text-white p-1.5 rounded-md flex items-center justify-center hover:bg-black/90 transition-colors"
                onClick={handleLightboxClick}
                aria-label="Expand to fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            )}
            
            {/* Pop-out button */}
            <button 
              className="bg-black/70 text-white p-1.5 rounded-md flex items-center justify-center hover:bg-black/90 transition-colors"
              onClick={handlePopOutClick}
              aria-label="Open in new window"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        // Placeholder/thumbnail that loads the video on click
        <div 
          className="absolute inset-0 w-full h-full rounded-lg bg-[hsl(var(--border))] flex flex-col items-center justify-center cursor-pointer"
          onClick={handlePlaceholderClick}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-12 h-12 text-[hsl(var(--foreground))] opacity-70 mb-2"
          >
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
          </svg>
          <div className="text-[hsl(var(--foreground))] opacity-70">Click to load video</div>
        </div>
      )}
    </div>
  );
});

VideoRenderer.displayName = 'VideoRenderer';

// Image renderer component
const ImageRenderer = memo(({ 
  src, 
  title,
  onClick 
}: { 
  src: string; 
  title: string;
  onClick?: () => void;
}) => {
  // Use a state to track when the image is loaded
  const [isLoaded, setIsLoaded] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  
  // Preload the image to get its natural dimensions
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setIsLoaded(true);
    };
    img.onerror = () => {
      // If image fails to load, set default dimensions
      setNaturalWidth(16);
      setNaturalHeight(9);
      setIsLoaded(true);
    };
  }, [src]);
  
  // Calculate aspect ratio for the container
  const aspectRatio = naturalWidth && naturalHeight 
    ? `${naturalWidth} / ${naturalHeight}` 
    : '16 / 9'; // Default aspect ratio
  
  return (
    <div 
      className="relative w-full rounded-lg overflow-hidden cursor-pointer"
      style={{ 
        aspectRatio,
        minHeight: isLoaded ? 'auto' : '200px' // Minimum height before image loads
      }}
      onClick={onClick}
    >
      {isLoaded ? (
        <Image 
          src={src}
          alt={title || "Project image"}
          fill 
          priority
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--border))]">
          <div className="animate-pulse">Loading...</div>
        </div>
      )}
    </div>
  );
});

ImageRenderer.displayName = 'ImageRenderer';

// Unified media renderer component
export const MediaRenderer = memo(({ 
  item, 
  title,
  onClick 
}: { 
  item: MediaItem; 
  title: string;
  onClick?: () => void;
}) => {
  return (
    <div className="w-full">
      {item.type === 'video' ? (
        <VideoRenderer src={item.src} title={title} onClick={onClick} />
      ) : (
        <ImageRenderer src={item.src} title={title} onClick={onClick} />
      )}
    </div>
  );
});

MediaRenderer.displayName = 'MediaRenderer';

export default MediaRenderer; 