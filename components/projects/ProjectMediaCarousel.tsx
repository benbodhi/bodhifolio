"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from 'embla-carousel-fade';
import type { MediaItem } from "@/lib/projects/types";
import { getVideoThumbnail, getVideoEmbedUrl } from "./ProjectMediaUtils";
import { openLightbox } from "./ProjectMediaLightboxGLightbox";
import "./project-media-carousel.css";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // Determine the media items to display
  const displayMedia = coverItem ? [coverItem] : media;
  
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
          // Only log errors in production
          if (process.env.NODE_ENV === 'production') {
            console.error("Error in autoplay:", error);
          }
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
  }, [emblaApi, autoplay, displayMedia.length]);
  
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
  
  // Function to handle media item click
  const handleMediaClick = (index: number) => {
    // Use a unique gallery ID for each lightbox instance
    const uniqueGalleryId = `carousel-${projectId}-${Date.now()}`;
    
    // Open the lightbox
    openLightbox(displayMedia, uniqueGalleryId, index);
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
          <div className="cursor-pointer relative media-carousel-image-container" onClick={() => handleMediaClick(0)}>
            <MediaItemComponent item={displayMedia[0]} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMediaCarousel; 