"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from 'embla-carousel-fade';
import type { MediaItem } from "@/lib/projects/types";
import { 
  getVideoThumbnail, 
  getVideoEmbedUrl, 
  extractVimeoID, 
  extractYouTubeID,
  getVimeoVideoDimensions,
  getYouTubeVideoDimensions
} from "./ProjectMediaUtils";
import { openLightbox } from "./ProjectMediaLightboxGLightbox";
import "./project-media-carousel.css";

export interface ProjectMediaCarouselProps {
  media: MediaItem[];
  _title?: string;
  projectId: string;
}

// MediaItem component to display an image or embedded video
const MediaItemComponent = ({ item, onPlayClick }: { item: MediaItem; onPlayClick: (e: React.MouseEvent) => void }) => {
  const [aspectRatio, setAspectRatio] = useState<string>("16/9"); // Default aspect ratio
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vimeoContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [vimeoPlayer, setVimeoPlayer] = useState<any>(null);
  const [vimeoThumbnailUrl, setVimeoThumbnailUrl] = useState<string | null>(null);

  // Function to get video dimensions and set aspect ratio
  const getVideoDimensions = useCallback(async () => {
    if (item.type !== 'video') return;
    
    try {
      let width = 16;
      let height = 9;
      
      // Determine video type and get dimensions
      if (item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'))) {
        const vimeoId = item.videoType === 'vimeo' 
          ? extractVimeoID(item.src) 
          : extractVimeoID(item.src);
        
        const dimensions = await getVimeoVideoDimensions(vimeoId);
        width = dimensions.width;
        height = dimensions.height;
      } else if (item.videoType === 'youtube' || (!item.videoType && (item.src.includes('youtube.com') || item.src.includes('youtu.be')))) {
        const dimensions = getYouTubeVideoDimensions();
        width = dimensions.width;
        height = dimensions.height;
      }
      
      // Set the aspect ratio
      if (width && height) {
        setAspectRatio(`${width}/${height}`);
      }
    } catch (error) {
      console.error('Error getting video dimensions:', error);
    }
  }, [item]);

  // For images, get dimensions from the loaded image
  const updateImageAspectRatio = useCallback(() => {
    if (imgRef.current && imgRef.current.complete) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (naturalWidth && naturalHeight) {
        console.log(`Thumbnail dimensions: ${naturalWidth}x${naturalHeight}`);
        setAspectRatio(`${naturalWidth}/${naturalHeight}`);
        setIsLoaded(true);
      }
    }
  }, []);

  // Effect to set the correct aspect ratio when component mounts
  useEffect(() => {
    if (item.type === 'video') {
      // For videos, first try to get dimensions from the API
      getVideoDimensions();
    } else if (imgRef.current && imgRef.current.complete) {
      updateImageAspectRatio();
    }
  }, [item, getVideoDimensions, updateImageAspectRatio]);

  // For videos, let's rely on the natural dimensions of the thumbnail image
  useEffect(() => {
    if (item.type === 'video' && imgRef.current) {
      // Add an event listener to get the natural dimensions once the image loads
      const handleImageLoad = () => {
        if (imgRef.current) {
          const { naturalWidth, naturalHeight } = imgRef.current;
          if (naturalWidth && naturalHeight) {
            console.log(`Video thumbnail dimensions: ${naturalWidth}x${naturalHeight}`);
            setAspectRatio(`${naturalWidth}/${naturalHeight}`);
          }
        }
      };
      
      // If the image is already loaded, get dimensions now
      if (imgRef.current.complete) {
        handleImageLoad();
      } else {
        // Otherwise, add a load event listener
        imgRef.current.addEventListener('load', handleImageLoad);
        return () => {
          if (imgRef.current) {
            imgRef.current.removeEventListener('load', handleImageLoad);
          }
        };
      }
    }
  }, [item.type]);

  // Initialize Vimeo player when needed
  const initializeVimeoPlayer = useCallback(async () => {
    if (item.type !== 'video' || !vimeoContainerRef.current) return;
    
    // Check if it's a Vimeo video
    const isVimeo = item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'));
    if (!isVimeo) return;
    
    try {
      // Make sure Vimeo SDK is loaded
      if (typeof window !== 'undefined' && !window.Vimeo) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://player.vimeo.com/api/player.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (err) => reject(err);
          document.head.appendChild(script);
        });
      }
      
      if (typeof window !== 'undefined' && window.Vimeo && vimeoContainerRef.current) {
        const vimeoId = item.videoType === 'vimeo' 
          ? extractVimeoID(item.src) 
          : extractVimeoID(item.src);
        
        console.log('Creating Vimeo player with ID:', vimeoId);
        
        // Create player with options
        const player = new window.Vimeo.Player(vimeoContainerRef.current, {
          id: parseInt(vimeoId, 10), // Vimeo API expects a number, not a string
          autoplay: true, // Set to true to play immediately
          portrait: false,
          title: false,
          byline: false,
          badge: false,
          dnt: true,
          transparent: false,
          background: false,
          responsive: true,
          controls: true
        });
        
        // Store the player instance
        setVimeoPlayer(player);
        
        // Get the video dimensions to set the correct size
        player.getVideoWidth().then((width: number) => {
          player.getVideoHeight().then((height: number) => {
            if (width && height) {
              console.log(`Vimeo video dimensions: ${width}x${height}`);
              setAspectRatio(`${width}/${height}`);
            }
          });
        });
        
        // Add event listeners
        player.on('play', () => {
          console.log('Vimeo video is playing');
        });
        
        player.on('error', (err: any) => {
          console.error('Vimeo player error:', err);
        });
      }
    } catch (error) {
      console.error('Error initializing Vimeo player:', error);
    }
  }, [item]);

  // Handle play button click
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent lightbox from opening
    setIsVideoPlaying(true);
    
    if (item.type === 'video') {
      if (item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'))) {
        // Initialize Vimeo player
        initializeVimeoPlayer();
      }
    }
    
    // Call the parent's onPlayClick handler
    onPlayClick(e);
  };

  // Effect to initialize Vimeo player when video starts playing
  useEffect(() => {
    if (isVideoPlaying && item.type === 'video') {
      if (item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'))) {
        initializeVimeoPlayer();
      }
    }
  }, [isVideoPlaying, item, initializeVimeoPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vimeoPlayer) {
        vimeoPlayer.destroy();
      }
    };
  }, [vimeoPlayer]);

  // Effect to fetch Vimeo thumbnail URL
  useEffect(() => {
    const fetchVimeoThumbnail = async () => {
      if (item.type === 'video' && 
          (item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com')))) {
        try {
          const vimeoId = item.videoType === 'vimeo' 
            ? extractVimeoID(item.src) 
            : extractVimeoID(item.src);
          
          // Fetch thumbnail URL from Vimeo's oEmbed API
          const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
          const data = await response.json();
          
          if (data.thumbnail_url) {
            console.log('Vimeo thumbnail URL:', data.thumbnail_url);
            setVimeoThumbnailUrl(data.thumbnail_url);
            
            // Also set the aspect ratio based on the video dimensions
            if (data.width && data.height) {
              console.log(`Vimeo video dimensions from API: ${data.width}x${data.height}`);
              setAspectRatio(`${data.width}/${data.height}`);
            }
          }
        } catch (error) {
          console.error('Error fetching Vimeo thumbnail:', error);
        }
      }
    };
    
    fetchVimeoThumbnail();
  }, [item]);

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
      {item.type === 'image' && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          ref={imgRef}
          src={item.src} 
          alt="" 
          className="media-carousel-image"
          loading="lazy"
          onLoad={updateImageAspectRatio}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}
      
      {item.type === 'video' && !isVideoPlaying && (
        <>
          {/* Video thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            ref={imgRef}
            src={
              // For Vimeo videos, use the thumbnail URL from the API if available
              item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'))
                ? vimeoThumbnailUrl || getVideoThumbnail(item)
                : getVideoThumbnail(item)
            } 
            alt="" 
            className="media-carousel-image"
            loading="lazy"
            onLoad={updateImageAspectRatio}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          
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
          {/* Vimeo video */}
          {(item.videoType === 'vimeo' || (!item.videoType && item.src.includes('vimeo.com'))) && (
            <div 
              ref={vimeoContainerRef}
              className="vimeo-player-container"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          )}
          
          {/* YouTube video */}
          {(item.videoType === 'youtube' || (!item.videoType && (item.src.includes('youtube.com') || item.src.includes('youtu.be')))) && (
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
        </div>
      )}
    </div>
  );
};

const ProjectMediaCarousel = ({ media, _title, projectId }: ProjectMediaCarouselProps) => {
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
  
  // Autoplay functionality - always define the callback regardless of conditions
  const autoplay = useCallback(() => {
    // Don't autoplay if a video is playing
    if (activeVideoIndex !== null) return;
    
    // Early return moved inside the callback body
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
  // Always call useEffect regardless of conditions
  useEffect(() => {
    // Early return moved inside the effect body
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
    // Early return moved inside the callback body
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
    // No early return, just an empty effect if emblaApi is not available
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
    // Early return moved inside the effect body
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
  
  // For empty media array, return nothing - MOVED HERE after all hooks
  if (!media || media.length === 0) {
    return null;
  }
  
  // Function to handle media item click
  const handleMediaClick = (index: number) => {
    // Use a unique gallery ID for each lightbox instance
    const uniqueGalleryId = `carousel-${projectId}-${Date.now()}`;
    
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

export default ProjectMediaCarousel;

// Add global type definition for Vimeo Player SDK
declare global {
  interface Window {
    Vimeo?: {
      Player: any;
    };
  }
} 