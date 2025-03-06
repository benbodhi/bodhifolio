import Image from "next/image"
import { MediaItem, ProjectItemProps } from "@/lib/projects/types"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef, memo } from "react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import Video from "yet-another-react-lightbox/plugins/video"
import MediaCarousel from "./MediaCarousel"

// Define types for lightbox slides
type LightboxSlide = {
  src: string;
} | {
  type: 'video';
  width: number;
  height: number;
  poster: string;
  sources: {
    src: string;
    type: string;
  }[];
};

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
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Handle Vimeo URLs
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
  }
  
  // Return original URL if no formatting needed or as fallback
  return url;
};

// Memoized video player component to prevent unnecessary re-renders and reloads
const VideoPlayer = memo(({ videoUrl }: { videoUrl: string }) => {
  // Format the video URL once and store it
  const formattedUrl = useRef(formatVideoUrl(videoUrl));
  
  // Use state to control when the iframe is actually rendered
  const [shouldRender, setShouldRender] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
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
  
  // Create a thumbnail/placeholder instead of directly embedding
  const handlePlaceholderClick = useCallback(() => {
    setShouldRender(true);
  }, []);
  
  return (
    <div className="relative w-full aspect-video mb-8">
      {hasError ? (
        // Error state
        <div className="absolute inset-0 w-full h-full rounded-lg bg-[hsl(var(--border))] flex flex-col items-center justify-center">
          <div className="text-[hsl(var(--foreground))] opacity-70 mb-2">Video could not be loaded</div>
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm"
          >
            Open video in new tab
          </a>
        </div>
      ) : shouldRender ? (
        // Actual iframe when ready to render
        <iframe
          ref={iframeRef}
          src={formattedUrl.current}
          className="absolute inset-0 w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Embedded video"
          onError={handleError}
        ></iframe>
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

VideoPlayer.displayName = 'VideoPlayer';

// Memoized project content to prevent re-renders
const ProjectContent = memo(({ 
  title, 
  description, 
  listItems, 
  promo, 
  links 
}: { 
  title: string;
  description: string;
  listItems?: string[];
  promo?: string;
  links?: { label: string; url: string }[];
}) => {
  return (
    <>
      <hr className="gradient-hr h-1 w-16 mb-8 border-0 rounded-sm"></hr>
      
      <h3 className="text-3xl title-text mb-8">{title}</h3>
      
      <div className="content-text mb-8 text-[hsl(var(--content))]" dangerouslySetInnerHTML={{ 
        __html: description.replace(/<a /g, '<a class="color-link" ') 
      }} />
      
      {listItems && listItems.length > 0 && (
        <ul className="list-disc pl-5 mb-8 text-[hsl(var(--content))]">
          {listItems.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ 
              __html: item.replace(/<a /g, '<a class="color-link" ') 
            }} />
          ))}
        </ul>
      )}
      
      {promo && (
        <div 
          className="bg-black/20 p-3 rounded-md text-sm font-medium mb-8 text-[hsl(var(--content))]"
          dangerouslySetInnerHTML={{ __html: promo.replace(/<a /g, '<a class="color-link" ') }}
        />
      )}
      
      {links && (
        <div className="flex flex-wrap gap-4">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card-button inline-flex items-center px-4 py-2 rounded-md group"
            >
              {link.label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </a>
          ))}
        </div>
      )}
    </>
  );
});

ProjectContent.displayName = 'ProjectContent';

// Image carousel component with CSS-based crossfade
const ImageCarousel = memo(({ 
  images, 
  image, 
  title, 
  onImageClick 
}: { 
  images?: string[];
  image?: string;
  title: string;
  onImageClick: () => void;
}) => {
  // For single image, just render it directly
  if (!images || images.length <= 1) {
    return (
      <div 
        className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden cursor-pointer"
        onClick={onImageClick}
      >
        <Image 
          src={image || (images && images[0]) || ''}
          alt={title}
          fill 
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }
  
  // For multiple images, use a simple index state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(images.length - 1);
  
  // Set up the rotation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex, images.length]);
  
  return (
    <div 
      className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden cursor-pointer bg-black"
      onClick={onImageClick}
    >
      {/* Background layer - always the current image */}
      <div className="absolute inset-0">
        <Image 
          src={images[currentIndex]}
          alt={`${title} - background`}
          fill 
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      {/* Render all images with CSS transitions */}
      {images.map((src, index) => {
        // Only render the current and previous images for performance
        if (index !== currentIndex && index !== previousIndex) return null;
        
        return (
          <div 
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ 
              opacity: index === currentIndex ? 1 : index === previousIndex ? 0 : 0,
              zIndex: index === currentIndex ? 2 : 1
            }}
          >
            <Image 
              src={src}
              alt={`${title} - image ${index + 1}`}
              fill 
              priority={index === 0}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        );
      })}
    </div>
  );
});

ImageCarousel.displayName = 'ImageCarousel';

// Helper function to convert legacy media to unified format
const convertLegacyMediaToUnified = (project: ProjectItemProps['project']): MediaItem[] => {
  const media: MediaItem[] = [];
  
  // Add images
  if (project.images && project.images.length > 0) {
    project.images.forEach(src => {
      media.push({
        type: 'image',
        src
      });
    });
  } else if (project.image) {
    media.push({
      type: 'image',
      src: project.image
    });
  }
  
  // Add video
  if (project.videoUrl) {
    media.push({
      type: 'video',
      src: project.videoUrl
    });
  }
  
  return media;
};

export function ProjectCard({ project, isFirstInColumn }: ProjectItemProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Use the new unified media approach
  const media = project.media || [];
  
  // If no media is defined, create it from legacy fields
  const unifiedMedia = media.length > 0 
    ? media 
    : convertLegacyMediaToUnified(project);
  
  // Find cover media item if specified
  const coverMediaItem = unifiedMedia.find(item => item.isCover);
  
  // If there's a cover media item, show it first, otherwise show the first item
  const displayMedia = coverMediaItem 
    ? [coverMediaItem, ...unifiedMedia.filter(item => !item.isCover)]
    : unifiedMedia;
  
  // Format media for lightbox
  const lightboxSlides: LightboxSlide[] = unifiedMedia.map(item => {
    if (item.type === 'image') {
      // For images, just return the source
      return { src: item.src };
    } else {
      // For videos, we need to format them for the lightbox video plugin
      let videoId = '';
      
      // Handle YouTube videos
      if (item.src.includes('youtube.com') || item.src.includes('youtu.be')) {
        // Extract video ID
        if (item.src.includes('youtube.com/watch')) {
          const urlParams = new URL(item.src).searchParams;
          videoId = urlParams.get('v') || '';
        } else if (item.src.includes('youtu.be/')) {
          videoId = item.src.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (item.src.includes('youtube.com/embed/')) {
          videoId = item.src.split('youtube.com/embed/')[1]?.split('?')[0] || '';
        } else if (item.src.includes('youtube.com/shorts/')) {
          videoId = item.src.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
        }
        
        if (videoId) {
          return {
            type: 'video' as const,
            width: 1280,
            height: 720,
            poster: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            sources: [
              {
                src: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`,
                type: 'video/mp4'
              }
            ]
          };
        }
      }
      
      // Handle Vimeo videos
      if (item.src.includes('vimeo.com')) {
        const vimeoId = item.src.split('vimeo.com/')[1]?.split('?')[0] || '';
        if (vimeoId) {
          return {
            type: 'video' as const,
            width: 1280,
            height: 720,
            poster: '', // Empty poster for Vimeo
            sources: [
              {
                src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
                type: 'video/mp4'
              }
            ]
          };
        }
      }
      
      // Default fallback for direct video URLs
      return {
        type: 'video' as const,
        width: 1280,
        height: 720,
        poster: '', // Empty poster for other videos
        sources: [
          {
            src: item.src,
            type: 'video/mp4'
          }
        ]
      };
    }
  });
  
  // Handle media click to open lightbox
  const handleMediaClick = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);
  
  return (
    <div className="border-b border-[hsl(var(--border))] last:border-b-0">
      <div className={cn(
        "p-12 [&>p:last-child]:mb-0",
        isFirstInColumn && "pt-0"
      )}>
        {/* Media Display */}
        {displayMedia.length > 0 && (
          <MediaCarousel 
            media={displayMedia}
            title={project.title}
            onMediaClick={handleMediaClick}
          />
        )}
        
        {/* Lightbox with video support */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          index={lightboxIndex}
          plugins={[Video]}
          carousel={{ 
            finite: false,
            preload: 1,
            padding: 0,
            spacing: 0,
            imageFit: "contain"
          }}
          controller={{ 
            closeOnBackdropClick: true,
            touchAction: "pan-y"
          }}
          render={{
            buttonPrev: unifiedMedia.length > 1 ? undefined : () => null,
            buttonNext: unifiedMedia.length > 1 ? undefined : () => null,
            iconNext: () => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
              </svg>
            ),
            iconPrev: () => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
            )
          }}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
            slide: { width: "100%", height: "100%" }
          }}
          video={{
            autoPlay: true,
            controls: true,
            playsInline: true,
            controlsList: "nodownload",
            loop: false
          }}
          animation={{ fade: 300 }}
          on={{
            view: ({ index }) => {
              // Update the current index
              setLightboxIndex(index);
            }
          }}
        />
        
        {/* Project Content - Memoized to prevent re-renders */}
        <ProjectContent 
          title={project.title}
          description={project.description}
          listItems={project.listItems}
          promo={project.promo}
          links={project.links}
        />
      </div>
    </div>
  );
} 