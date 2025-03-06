"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { MediaItem } from "@/lib/projects/types";
import "./media-carousel.css";
// Import GLightbox styles
import "glightbox/dist/css/glightbox.css";

interface MediaCarouselProps {
  media: MediaItem[];
  title: string;
  projectId: string;
}

/**
 * Extracts YouTube Video ID from a URL
 */
const extractYouTubeID = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : "";
};

/**
 * Extracts Vimeo Video ID from a URL
 */
const extractVimeoID = (url: string): string => {
  const match = url.match(/(?:vimeo\.com\/)([^&?/]+)/);
  return match ? match[1] : "";
};

/**
 * Gets the appropriate embed URL for videos
 */
const getVideoEmbedUrl = (item: MediaItem): string => {
  const { src, videoType } = item;
  
  // If videoType is explicitly set, use it
  if (videoType) {
    if (videoType === 'youtube') {
      return `https://www.youtube.com/embed/${extractYouTubeID(src)}?autoplay=1`;
    }
    if (videoType === 'vimeo') {
      return `https://player.vimeo.com/video/${extractVimeoID(src)}?autoplay=1`;
    }
    return src; // Local video
  }
  
  // Otherwise, try to detect from URL
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${extractYouTubeID(src)}?autoplay=1`;
  }
  if (src.includes("vimeo.com")) {
    return `https://player.vimeo.com/video/${extractVimeoID(src)}?autoplay=1`;
  }
  return src; // Local video
};

/**
 * Gets the appropriate thumbnail URL for videos
 */
const getVideoThumbnail = (item: MediaItem): string => {
  const { src, videoType, thumbnailUrl } = item;
  
  // If thumbnailUrl is explicitly set, use it
  if (thumbnailUrl) {
    return thumbnailUrl;
  }
  
  // If videoType is explicitly set, use it
  if (videoType) {
    if (videoType === 'youtube') {
      const videoId = extractYouTubeID(src);
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (videoType === 'vimeo') {
      return `https://vumbnail.com/${extractVimeoID(src)}.jpg`;
    }
    return "/images/video-placeholder.jpg"; // Local video
  }
  
  // Otherwise, try to detect from URL
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    const videoId = extractYouTubeID(src);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (src.includes("vimeo.com")) {
    return `https://vumbnail.com/${extractVimeoID(src)}.jpg`;
  }
  return "/images/video-placeholder.jpg"; // Fallback for local videos
};

// Simple MediaItem component to display an image or video thumbnail
const MediaItemComponent = ({ item }: { item: MediaItem }) => {
  return (
    <div className="media-item-wrapper">
      <img 
        src={item.type === "video" ? getVideoThumbnail(item) : item.src} 
        alt="" 
        className="media-carousel-image"
        loading="lazy"
      />
      {item.type === "video" && (
        <div className="video-play-overlay">
          <div className="video-play-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="48" height="48">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const MediaCarousel = ({ media, title, projectId }: MediaCarouselProps) => {
  // Configure Embla for pure crossfade with no sliding
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: media.length > 1,
    align: "center",
    axis: "y", // Use vertical axis to prevent horizontal sliding
    skipSnaps: true, // Allow skipping to any slide
    dragFree: true, // Prevent dragging behavior
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const lightboxRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  
  // For empty media array, return nothing
  if (!media || media.length === 0) {
    return null;
  }
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // Determine the media items to display
  const displayMedia = coverItem ? [coverItem] : media;
  
  // Create a unique gallery ID for this project
  const galleryId = `project-gallery-${projectId}`;
  
  // Autoplay functionality
  const autoplay = useCallback(() => {
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
          console.error("Error in autoplay:", error);
        }
      }
    }, 5000); // 5 seconds
  }, [emblaApi, displayMedia.length]);
  
  // Start autoplay when component mounts and when slide changes
  useEffect(() => {
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
      autoplay();
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
          console.error("Error removing event listener:", error);
        }
      }
      
      if (container) {
        container.removeEventListener('mouseenter', pauseAutoplay);
        container.removeEventListener('mouseleave', resumeAutoplay);
      }
    };
  }, [emblaApi, autoplay, displayMedia.length]);
  
  // Initialize GLightbox when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadGLightbox = async () => {
      try {
        // Dynamic import of GLightbox
        const GLightboxModule = await import('glightbox');
        const GLightbox = GLightboxModule.default;
        
        // Make sure the elements exist before initializing
        const elements = document.querySelectorAll(`.glightbox-${projectId}`);
        if (elements.length === 0) {
          console.warn(`No elements found with class .glightbox-${projectId}`);
          return;
        }
        
        const shouldLoopLightbox = displayMedia.length > 1;
        
        // Initialize GLightbox
        const lightbox = GLightbox({
          selector: `.glightbox-${projectId}`,
          touchNavigation: shouldLoopLightbox,
          loop: shouldLoopLightbox,
          autoplayVideos: true,
          plyr: {
            config: {
              ratio: '16:9', // Default aspect ratio
              fullscreen: { enabled: true, iosNative: true },
              youtube: { noCookie: true, rel: 0, showinfo: 0 },
              vimeo: { byline: false, portrait: false, title: false }
            }
          },
          closeButton: true,
          svg: {
            close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
            next: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
            prev: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>'
          }
        } as any);
        
        lightboxRef.current = lightbox;
        
        // Hide navigation for single items
        if (displayMedia.length === 1) {
          lightbox.on('open', () => {
            setTimeout(() => {
              document.querySelectorAll('.glightbox-container .gnext, .glightbox-container .gprev')
                .forEach(el => (el as HTMLElement).style.display = 'none');
            }, 100);
          });
        }
        
        console.log("GLightbox initialized successfully");
      } catch (error) {
        console.error("Failed to initialize GLightbox:", error);
      }
    };
    
    // Delay initialization to ensure DOM is ready
    setTimeout(loadGLightbox, 500);
    
    return () => {
      if (lightboxRef.current) {
        try {
          lightboxRef.current.destroy();
          lightboxRef.current = null;
        } catch (error) {
          console.error("Error destroying lightbox:", error);
        }
      }
    };
  }, [projectId, displayMedia.length]);
  
  // Handle index updates when swiping
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    
    // Get the current index
    const selectedIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(selectedIndex);
    
    // Apply 'is-selected' class to the active slide for crossfade effect
    const slides = emblaApi.slideNodes();
    
    // Add the class to the selected slide first, then remove from others
    // This prevents any black flash during transition
    if (slides[selectedIndex]) {
      slides[selectedIndex].classList.add('is-selected');
      
      // Then remove from other slides
      slides.forEach((slide, index) => {
        if (index !== selectedIndex) {
          slide.classList.remove('is-selected');
        }
      });
    }
    
    // Update container height based on current slide
    if (containerRef.current) {
      const slideNode = slides[selectedIndex];
      if (slideNode) {
        const img = slideNode.querySelector('img');
        if (img && img.complete && containerRef.current) {
          const height = img.offsetHeight;
          if (height > 0) {
            containerRef.current.style.height = `${height}px`;
          }
        }
      }
    }
  }, [emblaApi]);
  
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", onSelect);
      
      // Initial setup for crossfade
      emblaApi.on("init", () => {
        // Apply 'is-selected' class to the initial slide
        const slides = emblaApi.slideNodes();
        const selectedIndex = emblaApi.selectedScrollSnap();
        
        slides.forEach((slide, index) => {
          if (index === selectedIndex) {
            slide.classList.add('is-selected');
          } else {
            slide.classList.remove('is-selected');
          }
        });
        
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
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  const openLightbox = (index: number) => {
    if (typeof window === 'undefined') return;
    
    try {
      if (lightboxRef.current) {
        lightboxRef.current.openAt(index);
      } else {
        console.warn("Lightbox not initialized yet");
        // Try to initialize it again
        const loadGLightbox = async () => {
          const GLightboxModule = await import('glightbox');
          const GLightbox = GLightboxModule.default;
          
          const lightbox = GLightbox({
            selector: `.glightbox-${projectId}`,
            touchNavigation: displayMedia.length > 1,
            loop: displayMedia.length > 1,
            autoplayVideos: true
          } as any);
          
          lightboxRef.current = lightbox;
          setTimeout(() => {
            if (lightboxRef.current) {
              lightboxRef.current.openAt(index);
            }
          }, 100);
        };
        
        loadGLightbox();
      }
    } catch (error) {
      console.error("Error opening lightbox:", error);
    }
  };
  
  // Initialize the carousel with the first slide visible
  useEffect(() => {
    if (!emblaApi) return;
    
    // Apply 'is-selected' class to the initial slide immediately
    const slides = emblaApi.slideNodes();
    if (slides.length > 0) {
      slides[0].classList.add('is-selected');
    }
    
    // Update height for the first slide
    if (containerRef.current && slides.length > 0) {
      const firstSlide = slides[0];
      const img = firstSlide.querySelector('img');
      if (img) {
        if (img.complete) {
          const height = img.offsetHeight;
          if (height > 0) {
            containerRef.current.style.height = `${height}px`;
          }
        } else {
          img.onload = () => {
            if (containerRef.current) {
              const height = img.offsetHeight;
              if (height > 0) {
                containerRef.current.style.height = `${height}px`;
              }
            }
          };
        }
      }
    }
  }, [emblaApi]);
  
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
                    onClick={() => openLightbox(index)}
                  >
                    <div className="cursor-pointer relative media-carousel-image-container">
                      <MediaItemComponent item={item} />
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
                scrollPrev();
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
                scrollNext();
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
          <div className="cursor-pointer relative media-carousel-image-container" onClick={() => openLightbox(0)}>
            <MediaItemComponent item={displayMedia[0]} />
          </div>
        )}
      </div>
      
      {/* Hidden links for GLightbox */}
      <div className="hidden">
        {displayMedia.map((item, index) => (
          <a
            key={`lightbox-${item.src}-${index}`}
            href={item.type === "video" ? getVideoEmbedUrl(item) : item.src}
            className={`glightbox-${projectId}`}
            data-gallery={galleryId}
            data-type={item.type}
            data-description=""
          >
            {/* Hidden content for GLightbox */}
          </a>
        ))}
      </div>
    </div>
  );
};

export default MediaCarousel; 