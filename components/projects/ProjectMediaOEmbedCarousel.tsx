"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from 'embla-carousel-fade';
import type { MediaItem } from "@/lib/projects/types";
import { 
  fetchOEmbedData,
  getAspectRatio,
  getThumbnailUrl,
  getVideoProvider,
  extractYouTubeID,
  extractVimeoID,
  getModifiedEmbedHtml,
  OEmbedResponse
} from "./ProjectMediaOEmbedUtils";
import { openLightbox } from "./ProjectMediaOEmbedLightbox";
import "./project-media-carousel.css"; // Reusing the same CSS

export interface ProjectMediaOEmbedCarouselProps {
  media: MediaItem[];
  _title?: string;
  projectId: string;
}

// MediaItem component to display an image or embedded video with oEmbed data
const MediaItemComponent = ({ 
  item, 
  onPlayClick 
}: { 
  item: MediaItem; 
  onPlayClick: (e: React.MouseEvent) => void 
}) => {
  const [aspectRatio, setAspectRatio] = useState<string>("16/9"); // Default aspect ratio
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [oembedData, setOembedData] = useState<OEmbedResponse | null>(null);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(item.type === 'video'); // Only set loading for videos
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(item.type === 'image'); // Images start as loaded
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // Fetch oEmbed data when component mounts - ONLY for videos
  useEffect(() => {
    const fetchData = async () => {
      if (item.type === 'video') {
        setIsLoading(true);
        try {
          // Fetch oEmbed data
          const data = await fetchOEmbedData(item);
          if (data) {
            setOembedData(data);
            
            // Set aspect ratio based on oEmbed data
            if (data.width && data.height) {
              console.log(`Video dimensions from oEmbed: ${data.width}x${data.height}`);
              setAspectRatio(`${data.width}/${data.height}`);
            }
            
            // Set thumbnail URL
            if (data.thumbnail_url) {
              const thumbnail = await getThumbnailUrl(item);
              setThumbnailUrl(thumbnail);
            } else {
              // Fallback to manual thumbnail fetching
              const thumbnail = await getThumbnailUrl(item);
              setThumbnailUrl(thumbnail);
            }
            
            // Get embed HTML with autoplay parameter
            const html = await getModifiedEmbedHtml(item, { autoplay: true });
            setEmbedHtml(html);
          }
        } catch (error) {
          console.error('Error fetching oEmbed data:', error);
        } finally {
          setIsLoading(false);
          setIsLoaded(true);
        }
      }
    };
    
    if (item.type === 'video') {
      fetchData();
    }
  }, [item]);

  // For images, get dimensions from the loaded image
  const updateImageAspectRatio = useCallback(() => {
    if (imgRef.current && imgRef.current.complete) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (naturalWidth && naturalHeight) {
        console.log(`Image dimensions: ${naturalWidth}x${naturalHeight}`);
        
        // Only update aspect ratio for images, not video thumbnails
        if (item.type === 'image') {
          setAspectRatio(`${naturalWidth}/${naturalHeight}`);
        }
        
        setIsLoaded(true);
        
        if (item.type === 'video') {
          setThumbnailLoaded(true);
        }
      }
    }
  }, [item.type]);

  // Effect to set the correct aspect ratio for images when component mounts
  useEffect(() => {
    if (item.type === 'image' && imgRef.current && imgRef.current.complete) {
      updateImageAspectRatio();
    }
  }, [item, updateImageAspectRatio]);

  // Handle play button click
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent lightbox from opening
    setIsVideoPlaying(true);
    
    // Call the parent's onPlayClick handler
    onPlayClick(e);
  };

  // For video thumbnails, use object-fit: cover to ensure they fill the container
  // But maintain the correct aspect ratio from oEmbed data
  const videoThumbnailStyle = {
    width: '100%',
    height: '100%',
    objectFit: thumbnailLoaded ? 'cover' as const : 'contain' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  };

  // For images, use object-fit: contain to preserve aspect ratio
  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  };

  // Create a thumbnail container with the correct aspect ratio
  const thumbnailContainerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  return (
    <div 
      ref={containerRef}
      className="media-item-wrapper"
      style={{ 
        aspectRatio: aspectRatio,
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Loading indicator for videos only */}
      {isLoading && (
        <div className="loading-indicator" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 1
        }}>
          <div>Loading...</div>
        </div>
      )}

      {item.type === 'image' && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          ref={imgRef}
          src={item.src} 
          alt="" 
          className="media-carousel-image"
          loading="lazy"
          onLoad={updateImageAspectRatio}
          style={imageStyle}
        />
      )}
      
      {item.type === 'video' && !isVideoPlaying && (
        <>
          {/* Video thumbnail */}
          {thumbnailUrl && (
            <div style={thumbnailContainerStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                ref={imgRef}
                src={thumbnailUrl} 
                alt="" 
                className="media-carousel-image"
                loading="lazy"
                onLoad={updateImageAspectRatio}
                style={videoThumbnailStyle}
              />
            </div>
          )}
          
          {/* Clickable area for lightbox (the entire overlay) */}
          <div 
            className="video-play-overlay"
            onClick={(e) => {
              // By default, clicking anywhere opens the lightbox
              // The play button will stop propagation to prevent this
            }}
          >
            {/* Play button - only this triggers inline playback */}
            <div 
              className="video-play-button"
              onClick={handlePlayClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="48" height="48">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </>
      )}
      
      {item.type === 'video' && isVideoPlaying && (
        <div 
          className="video-player-container"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Use the embed HTML from oEmbed if available */}
          {embedHtml ? (
            <div 
              ref={videoContainerRef}
              className="oembed-player-container"
              style={{
                width: '100%',
                height: '100%',
              }}
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          ) : (
            // Fallback to manual embedding if oEmbed HTML is not available
            <>
              {/* Vimeo video */}
              {getVideoProvider(item) === 'vimeo' && (
                <iframe
                  src={`https://player.vimeo.com/video/${extractVimeoID(item.src)}?autoplay=1`}
                  title="Vimeo video player"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              )}
              
              {/* YouTube video */}
              {getVideoProvider(item) === 'youtube' && (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeID(item.src)}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ProjectMediaOEmbedCarousel = ({ media, _title, projectId }: ProjectMediaOEmbedCarouselProps) => {
  // Configure Embla with fade plugin
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: media.length > 1,
    align: "center",
    containScroll: false, // Recommended when using fade plugin
    dragFree: true, // Allows for more fluid dragging
    duration: 100 // Controls the speed of the transition in milliseconds
  }, [Fade()]);
  const [_currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // Determine the media items to display
  const displayMedia = coverItem ? [coverItem] : media;
  
  // Pause autoplay when a video is playing
  useEffect(() => {
    if (activeVideoIndex !== null && autoplayRef.current) {
      clearTimeout(autoplayRef.current);
    }
  }, [activeVideoIndex]);
  
  // Autoplay functionality
  const autoplay = useCallback(() => {
    // Don't autoplay if a video is playing
    if (activeVideoIndex !== null) return;
    
    // Early return if no emblaApi or only one slide
    if (!emblaApi || displayMedia.length <= 1) return;
    
    // Clear any existing timeout
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
    }
    
    // Set a new timeout to advance to the next slide after 5 seconds
    autoplayRef.current = setTimeout(() => {
      if (emblaApi) {
        try {
          emblaApi.scrollNext();
        } catch (error) {
          // Embla API might be destroyed
          // Only log errors in production
          if (process.env.NODE_ENV === 'production') {
            console.error("Error in autoplay:", error);
          }
        }
      }
    }, 5000); // 5 seconds
  }, [emblaApi, displayMedia.length, activeVideoIndex]);
  
  // Start autoplay when component mounts and when slide changes
  useEffect(() => {
    // Early return if no emblaApi or only one slide
    if (!emblaApi || displayMedia.length <= 1) return;
    
    // Start autoplay
    autoplay();
    
    // Add event listener to restart autoplay after slide changes
    emblaApi.on('select', autoplay);
    
    // Pause autoplay on hover
    const pauseAutoplay = () => {
      if (autoplayRef.current) {
        clearTimeout(autoplayRef.current);
      }
    };
    
    // Resume autoplay when mouse leaves
    const resumeAutoplay = () => {
      // Only resume if no video is playing
      if (activeVideoIndex === null) {
        autoplay();
      }
    };
    
    // Get the container element
    const container = emblaApi.rootNode();
    if (container) {
      container.addEventListener('mouseenter', pauseAutoplay);
      container.addEventListener('mouseleave', resumeAutoplay);
    }
    
    // Clean up
    return () => {
      if (autoplayRef.current) {
        clearTimeout(autoplayRef.current);
      }
      
      if (emblaApi) {
        try {
          emblaApi.off('select', autoplay);
        } catch (error) {
          // Embla API might be destroyed
          // Only log errors in production
          if (process.env.NODE_ENV === 'production') {
            console.error("Error removing event listener:", error);
          }
        }
      }
      
      if (container) {
        container.removeEventListener('mouseenter', pauseAutoplay);
        container.removeEventListener('mouseleave', resumeAutoplay);
      }
    };
  }, [emblaApi, autoplay, displayMedia.length, activeVideoIndex]);
  
  // Handle slide selection
  const onSelect = useCallback(() => {
    // Early return if no emblaApi
    if (!emblaApi) return;
    
    const selectedIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(selectedIndex);
    
    // Reset active video when changing slides
    setActiveVideoIndex(null);
    
    // Update container height based on current slide
    if (containerRef.current) {
      const slideNode = emblaApi.slideNodes()[selectedIndex];
      if (slideNode) {
        const mediaItemWrapper = slideNode.querySelector('.media-item-wrapper');
        if (mediaItemWrapper && mediaItemWrapper instanceof HTMLElement) {
          // Get the computed style to find the actual height after aspect ratio is applied
          const computedStyle = window.getComputedStyle(mediaItemWrapper);
          const height = parseFloat(computedStyle.height);
          
          if (height > 0) {
            containerRef.current.style.height = `${height}px`;
          }
        }
      }
    }
  }, [emblaApi]);
  
  useEffect(() => {
    // Always call the effect, but handle the condition inside
    if (emblaApi) {
      emblaApi.on("select", onSelect);
      
      // Initial setup
      emblaApi.on("init", () => {
        setTimeout(onSelect, 100);
      });
      
      // Update height when images load
      const slides = emblaApi.slideNodes();
      slides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img) {
          img.onload = onSelect;
        }
      });
      
      // Also update on window resize
      window.addEventListener('resize', onSelect);
      
      return () => {
        emblaApi.off("select", onSelect);
        window.removeEventListener('resize', onSelect);
      };
    }
  }, [emblaApi, onSelect]);
  
  // Add a resize handler to update container heights when window is resized
  useEffect(() => {
    if (!emblaApi) return;
    
    const handleResize = () => {
      // Delay the height update to ensure all calculations are complete
      setTimeout(onSelect, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [emblaApi, onSelect]);
  
  // Initialize the carousel with the first slide visible
  useEffect(() => {
    // Early return if no emblaApi
    if (!emblaApi) return;
    
    // Update height for the first slide after a short delay
    const updateInitialHeight = () => {
      if (containerRef.current) {
        const slides = emblaApi.slideNodes();
        if (slides.length > 0) {
          const firstSlide = slides[0];
          const mediaItemWrapper = firstSlide.querySelector('.media-item-wrapper');
          
          if (mediaItemWrapper && mediaItemWrapper instanceof HTMLElement) {
            const computedStyle = window.getComputedStyle(mediaItemWrapper);
            const height = parseFloat(computedStyle.height);
            
            if (height > 0 && containerRef.current) {
              containerRef.current.style.height = `${height}px`;
            }
          }
        }
      }
    };
    
    // Try multiple times with increasing delays to ensure images and videos have loaded
    [0, 100, 300, 500, 1000].forEach(delay => {
      setTimeout(updateInitialHeight, delay);
    });
    
  }, [emblaApi]);
  
  // For empty media array, return nothing
  if (!media || media.length === 0) {
    return null;
  }
  
  // Function to handle media item click
  const handleMediaClick = (index: number) => {
    // Use a unique gallery ID for each lightbox instance
    const uniqueGalleryId = `oembed-carousel-${projectId}-${Date.now()}`;
    
    // Open the lightbox
    openLightbox(displayMedia, uniqueGalleryId, index);
  };
  
  // Function to handle play button click
  const handlePlayClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent lightbox from opening
    setActiveVideoIndex(index);
  };
  
  return (
    <div className="project-media-container">
      <div className="media-carousel-container" ref={containerRef}>
        {displayMedia.length > 1 ? (
          <>
            <div className="embla" ref={emblaRef}>
              <div className="embla__container">
                {displayMedia.map((item, index) => (
                  <div 
                    key={`${item.src}-${index}`} 
                    className="embla__slide"
                    onClick={() => handleMediaClick(index)}
                  >
                    <div className="cursor-pointer relative media-carousel-image-container">
                      <MediaItemComponent 
                        item={item} 
                        onPlayClick={handlePlayClick(index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation buttons */}
            <button 
              className="embla__prev" 
              onClick={(e) => {
                e.stopPropagation();
                if (emblaApi) emblaApi.scrollPrev();
              }}
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button 
              className="embla__next" 
              onClick={(e) => {
                e.stopPropagation();
                if (emblaApi) emblaApi.scrollNext();
              }}
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </>
        ) : (
          // Single item doesn't need carousel
          <div className="cursor-pointer relative media-carousel-image-container" onClick={() => handleMediaClick(0)}>
            <MediaItemComponent 
              item={displayMedia[0]} 
              onPlayClick={handlePlayClick(0)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMediaOEmbedCarousel; 