import Image from "next/image"
import { ProjectItemProps } from "@/lib/projects/types"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef, memo } from "react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

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
            className="text-sm color-link"
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
          className="bg-[hsl(var(--border))] p-3 rounded-md text-sm font-medium mb-8 text-[hsl(var(--content))]"
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

// Image carousel component
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasMultipleImages = images && images.length > 1;
  
  useEffect(() => {
    if (!hasMultipleImages) return;
    
    const startTransition = () => {
      if (images) {
        const next = (currentIndex + 1) % images.length;
        setNextIndex(next);
        setIsTransitioning(true);
        
        // After transition completes, update current image
        setTimeout(() => {
          setCurrentIndex(next);
          setNextIndex(null);
          setIsTransitioning(false);
        }, 1000); // 1 second transition
      }
    };
    
    intervalRef.current = setInterval(startTransition, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, hasMultipleImages, images]);
  
  return (
    <div 
      className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden cursor-pointer"
      onClick={onImageClick}
    >
      <div className="absolute inset-0">
        {/* Current image */}
        <Image 
          src={images ? images[currentIndex] : image!}
          alt={title}
          fill 
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Next image for crossfade */}
        {nextIndex !== null && images && (
          <div 
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: isTransitioning ? 1 : 0 }}
          >
            <Image 
              src={images[nextIndex]}
              alt={title}
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </div>
    </div>
  );
});

ImageCarousel.displayName = 'ImageCarousel';

export function ProjectCard({ project, isFirstInColumn }: ProjectItemProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Format images for lightbox
  const lightboxImages = project.images 
    ? project.images.map(src => ({ src }))
    : project.image 
      ? [{ src: project.image }] 
      : [];
  
  // Handle image click to open lightbox
  const handleImageClick = useCallback(() => {
    setLightboxOpen(true);
  }, []);
  
  return (
    <div className="border-b border-[hsl(var(--border))] last:border-b-0">
      <div className={cn(
        "p-12 [&>p:last-child]:mb-0",
        isFirstInColumn && "pt-0"
      )}>
        {/* Image Carousel */}
        {(project.image || project.images) && (
          <ImageCarousel 
            images={project.images}
            image={project.image}
            title={project.title}
            onImageClick={handleImageClick}
          />
        )}
        
        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxImages}
          index={lightboxIndex}
        />
        
        {/* Video - Using memoized component */}
        {project.videoUrl && <VideoPlayer videoUrl={project.videoUrl} />}

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