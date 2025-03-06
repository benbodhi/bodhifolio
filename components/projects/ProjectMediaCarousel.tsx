"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from 'embla-carousel-fade';
import type { MediaItem } from "@/lib/projects/types";
import { getVideoThumbnail, getVideoEmbedUrl } from "./ProjectMediaUtils";
import "./project-media-carousel.css";
// Import GLightbox styles
import "glightbox/dist/css/glightbox.css";

// Define a more generic type for GLightbox to avoid type conflicts
// Prefixing with underscore to indicate it's intentionally unused
type _GLightboxType = {
  openAt: (index: number) => void;
  destroy: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, callback: (data: any) => void) => void;
  close: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow any other properties
};

export interface ProjectMediaCarouselProps {
  media: MediaItem[];
  _title?: string;
  projectId: string;
}

// Simple MediaItem component to display an image or video thumbnail
const MediaItemComponent = ({ item }: { item: MediaItem }) => {
  return (
    <div className="media-item-wrapper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lightboxRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // Determine the media items to display
  const displayMedia = coverItem ? [coverItem] : media;
  
  // Create a unique gallery ID for this project
  const galleryId = `project-gallery-${projectId}`;
  
  // Autoplay functionality - always define the callback regardless of conditions
  const autoplay = useCallback(() => {
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
          console.error("Error in autoplay:", error);
        }
      }
    }, 5000); // 5 seconds
  }, [emblaApi, displayMedia.length]);
  
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
    // Early return moved inside the effect body
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
          zoomable: true,
          draggable: true,
          preload: true, // Preload content for smoother transitions
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
        });
        
        lightboxRef.current = lightbox;
        
        // Handle zoom behavior to ensure proper centering
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lightbox as any).on('slide_after_load', (data: any) => {
          const slideContent = data.slideNode.querySelector('.gslide-image img');
          if (slideContent) {
            // Add click handler for zooming
            slideContent.addEventListener('click', function(this: HTMLElement, e: Event) {
              // Prevent default zoom behavior
              e.preventDefault();
              e.stopPropagation();
              
              // Toggle zoomed class
              if (this.classList.contains('zoomed')) {
                this.classList.remove('zoomed');
                this.style.transform = '';
              } else {
                this.classList.add('zoomed');
                // Center the image when zoomed
                this.style.transform = 'scale(1.5)';
              }
            });
          }
        });
        
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
  
  // Handle slide selection
  const onSelect = useCallback(() => {
    // Early return moved inside the callback body
    if (!emblaApi) return;
    
    setCurrentIndex(emblaApi.selectedScrollSnap());
    
    // Update container height based on current slide
    if (containerRef.current) {
      const slideNode = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()];
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
  
  const scrollPrev = useCallback(() => {
    // Condition inside the callback body
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    // Condition inside the callback body
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Early return moved inside the effect body
    if (!emblaApi) return;
    
    // Update height for the first slide
    if (containerRef.current) {
      const slides = emblaApi.slideNodes();
      if (slides.length > 0) {
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
    }
  }, [emblaApi]);
  
  // For empty media array, return nothing - MOVED HERE after all hooks
  if (!media || media.length === 0) {
    return null;
  }
  
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

export default ProjectMediaCarousel; 