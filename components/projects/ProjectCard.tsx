import Image from "next/image"
import { MediaItem, ProjectItemProps } from "@/lib/projects/types"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef, memo } from "react"
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
} | {
  // Custom slide type for YouTube/Vimeo
  custom: {
    type: 'youtube' | 'vimeo';
    id: string;
    render: () => React.ReactNode;
  }
};

// Custom YouTube component
const YouTubeEmbed = memo(({ videoId }: { videoId: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="w-full max-w-5xl aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
});

YouTubeEmbed.displayName = 'YouTubeEmbed';

// Custom Vimeo component
const VimeoEmbed = memo(({ videoId }: { videoId: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="w-full max-w-5xl aspect-video">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&transparent=0&responsive=1`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
});

VimeoEmbed.displayName = 'VimeoEmbed';

// Custom render function for the lightbox
const renderCustomSlide = (slide: any) => {
  if (!slide.custom) return undefined;
  
  if (slide.custom.type === 'youtube') {
    return <YouTubeEmbed videoId={slide.custom.id} />;
  }
  
  if (slide.custom.type === 'vimeo') {
    return <VimeoEmbed videoId={slide.custom.id} />;
  }
  
  return undefined;
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

/**
 * Determines the video type from a URL
 */
const getVideoTypeFromUrl = (url: string): 'youtube' | 'vimeo' | 'local' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'local';
};

/**
 * Converts legacy media fields to the unified MediaItem[] format
 */
const convertLegacyMediaToUnified = (project: ProjectItemProps['project']): MediaItem[] => {
  const media: MediaItem[] = [];
  
  // Add cover image if it exists
  if (project.image) {
    media.push({
      type: 'image',
      src: project.image,
      isCover: true
    });
  }
  
  // Add additional images if they exist
  if (project.images && Array.isArray(project.images)) {
    project.images.forEach(img => {
      media.push({
        type: 'image',
        src: img
      });
    });
  }
  
  // Add video if it exists
  if (project.videoUrl) {
    const videoType = getVideoTypeFromUrl(project.videoUrl);
    media.push({
      type: 'video',
      src: project.videoUrl,
      videoType
    });
  }
  
  return media;
};

/**
 * Renders HTML content safely
 */
const RenderHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export function ProjectCard({ project, isFirstInColumn }: ProjectItemProps) {
  // Use unified media format or convert from legacy fields
  const mediaItems = project.media || convertLegacyMediaToUnified(project);
  
  // Create a unique ID for this project based on its id or title
  const projectId = `project-${project.id || project.title.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="border-b border-[hsl(var(--border))] last:border-b-0">
      <div className={cn(
        "p-12 [&>p:last-child]:mb-0",
        isFirstInColumn && "pt-0"
      )}>
        {/* Media Display */}
        {mediaItems.length > 0 && (
          <div className="project-media-container">
            <MediaCarousel 
              media={mediaItems}
              title={project.title}
              projectId={projectId}
            />
          </div>
        )}
        
        {/* Project Content */}
        <div className="mt-6">
          <hr className="gradient-hr h-1 w-16 mb-8 border-0 rounded-sm"></hr>
          
          <h3 className="text-3xl title-text mb-8">{project.title}</h3>
          
          <div className="content-text mb-8 text-[hsl(var(--content))]" dangerouslySetInnerHTML={{ 
            __html: project.description.replace(/<a /g, '<a class="color-link" ') 
          }} />
          
          {project.listItems && project.listItems.length > 0 && (
            <ul className="list-disc pl-5 mb-8 text-[hsl(var(--content))]">
              {project.listItems.map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ 
                  __html: item.replace(/<a /g, '<a class="color-link" ') 
                }} />
              ))}
            </ul>
          )}
          
          {project.promo && (
            <div 
              className="bg-black/20 p-3 rounded-md text-sm font-medium mb-8 text-[hsl(var(--content))]"
              dangerouslySetInnerHTML={{ __html: project.promo.replace(/<a /g, '<a class="color-link" ') }}
            />
          )}
          
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {project.links.map((link, index) => (
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
        </div>
      </div>
    </div>
  );
} 