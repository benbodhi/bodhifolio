"use client";

import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";
import type { MediaItem } from "@/lib/projects/types";
// Remove direct import of GLightbox
// import GLightbox from "glightbox";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
// Import GLightbox styles
import "glightbox/dist/css/glightbox.css";

// Add custom styles to override Swiper's default behavior
import "./media-carousel.css";

interface MediaCarouselProps {
  media: MediaItem[];
  title: string;
  projectId: string; // Add projectId to isolate galleries
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
      // Use maxresdefault for higher quality, fallback to hqdefault
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
    // Use maxresdefault for higher quality, fallback to hqdefault
    const videoId = extractYouTubeID(src);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (src.includes("vimeo.com")) {
    return `https://vumbnail.com/${extractVimeoID(src)}.jpg`;
  }
  return "/images/video-placeholder.jpg"; // Fallback for local videos
};

/**
 * Determines if a URL is a video URL
 */
const isVideoUrl = (url: string): boolean => {
  return (
    url.includes("youtube.com") || 
    url.includes("youtu.be") || 
    url.includes("vimeo.com") || 
    url.endsWith(".mp4") || 
    url.endsWith(".webm") || 
    url.endsWith(".ogg")
  );
};

// Simple MediaItem component to display an image or video thumbnail
const MediaItemComponent = ({ item }: { item: MediaItem }) => {
  return (
    <div className="w-full h-full">
      <img 
        src={item.type === "video" ? getVideoThumbnail(item) : item.src} 
        alt="" 
        className="w-full h-full object-cover media-carousel-image"
        loading="lazy"
        onLoad={(e) => {
          // Force a resize event after image loads to ensure proper height
          if (typeof window !== 'undefined') {
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
          }
        }}
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
  const lightboxRef = useRef<any>(null);
  const [lightboxInitialized, setLightboxInitialized] = useState(false);
  const swiperRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Add state to force re-renders
  const randomizedMediaRef = useRef<MediaItem[] | null>(null);
  
  // For empty media array, return nothing
  if (!media || media.length === 0) {
    return null;
  }
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  
  // Use useEffect to randomize media items only once when the component mounts
  // or when the media array changes
  useEffect(() => {
    if (media.length > 5) {
      // Create a copy of the media array without the cover item
      const mediaWithoutCover = coverItem 
        ? media.filter(item => !item.isCover) 
        : [...media];
      
      // Shuffle the non-cover items
      const shuffledMedia = [...mediaWithoutCover].sort(() => Math.random() - 0.5);
      
      // If there's a cover item, put it first
      randomizedMediaRef.current = coverItem ? [coverItem, ...shuffledMedia] : shuffledMedia;
    } else {
      // For 5 or fewer items, just use the original order or show only the cover
      randomizedMediaRef.current = null;
    }
  }, [media, coverItem]);
  
  // Determine the media items to display
  const displayMedia = randomizedMediaRef.current || (coverItem ? [coverItem] : media);

  // Determine if we should use loop mode
  const shouldLoop = displayMedia.length >= 3; // Enable loop mode only when there are at least 3 items
  const slidesPerView = 1;
  const minSlidesForLoop = 3; // Minimum slides needed for loop mode
  
  const shouldAutoplay = !coverItem && displayMedia.length > 1;
  
  // Create a unique gallery ID for this project
  const galleryId = `project-gallery-${projectId}`;
  
  // Safely update the swiper height
  const updateSwiperHeight = () => {
    if (typeof window === 'undefined' || !swiperInstance || swiperInstance.destroyed) return;
    
    try {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        // Check if swiper is still valid before updating
        if (swiperInstance && !swiperInstance.destroyed) {
          if (typeof swiperInstance.updateAutoHeight === 'function') {
            swiperInstance.updateAutoHeight();
          }
          
          // Force a re-render after a short delay to ensure height is updated
          setTimeout(() => {
            setForceUpdate(prev => prev + 1);
          }, 50);
        }
      });
    } catch (error) {
      console.error("Error updating swiper height:", error);
    }
  };
  
  // Force resize the swiper container to match the current slide
  const forceResizeSwiper = () => {
    if (typeof window === 'undefined' || !swiperInstance || swiperInstance.destroyed) return;
    
    try {
      // Safely check if slides and activeIndex exist
      if (!swiperInstance.slides || typeof swiperInstance.activeIndex !== 'number') return;
      
      // Get the correct slide index (handle loop mode)
      let slideIndex = swiperInstance.activeIndex;
      if (swiperInstance.params.loop && typeof swiperInstance.realIndex === 'number') {
        slideIndex = swiperInstance.realIndex;
      }
      
      const activeSlide = swiperInstance.slides[slideIndex];
      if (!activeSlide) return;
      
      const slideContent = activeSlide.querySelector('img');
      if (!slideContent) return;
      
      // Get the natural dimensions of the image
      const imgWidth = slideContent.naturalWidth || slideContent.offsetWidth;
      const imgHeight = slideContent.naturalHeight || slideContent.offsetHeight;
      
      if (imgWidth && imgHeight) {
        // Calculate aspect ratio
        const aspectRatio = imgHeight / imgWidth;
        
        // Get the container width
        const containerWidth = swiperInstance.width;
        
        // Calculate the height based on aspect ratio and container width
        const calculatedHeight = containerWidth * aspectRatio;
        
        // Apply the height to the swiper container with a transition matching the slide transition
        if (swiperInstance.el) {
          // Apply the transition directly to the element
          swiperInstance.el.style.transition = `height 2s ease`;
          swiperInstance.el.style.height = `${calculatedHeight}px`;
          
          // Also apply to the wrapper
          const wrapper = swiperInstance.el.querySelector('.swiper-wrapper');
          if (wrapper) {
            wrapper.style.transition = `height 2s ease`;
            wrapper.style.height = `${calculatedHeight}px`;
          }
        }
      }
    } catch (error) {
      console.error("Error forcing resize:", error);
    }
  };
  
  // Initialize GLightbox when component mounts
  useEffect(() => {
    // Dynamically import GLightbox only on the client side
    const initLightbox = async () => {
      try {
        // Dynamic import of GLightbox
        const GLightboxModule = await import('glightbox');
        const GLightbox = GLightboxModule.default;
        
        // Determine if we should loop in the lightbox
        // Only loop if there are multiple media items
        const shouldLoopLightbox = displayMedia.length > 1;
        
        // Initialize GLightbox
        const lightbox = GLightbox({
          selector: `.glightbox-${projectId}`,
          touchNavigation: shouldLoopLightbox,
          loop: shouldLoopLightbox,
          autoplayVideos: true,
          plyr: {
            ratio: undefined,
            config: {
              fullscreen: { enabled: true, iosNative: true },
              youtube: { noCookie: true, rel: 0, showinfo: 0 },
              vimeo: { byline: false, portrait: false, title: false }
            }
          },
          slideEffect: 'fade',
          closeButton: true,
          zoomable: false,
          draggable: shouldLoopLightbox,
          dragToleranceX: 40,
          dragToleranceY: 40,
          // Add custom CSS classes for styling
          cssEfects: {
            fade: { in: 'fadeIn', out: 'fadeOut' }
          },
          // Use SVG icons that match our carousel
          svg: {
            play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>'
          }
        } as any);
        
        lightboxRef.current = lightbox;
        setLightboxInitialized(true);
        
        // Add event listeners after initialization
        lightbox.on('open', () => {
          // If there's only one item, make sure navigation is disabled
          if (displayMedia.length === 1) {
            setTimeout(() => {
              const nextButton = document.querySelector('.gnext');
              const prevButton = document.querySelector('.gprev');
              if (nextButton) nextButton.setAttribute('style', 'display: none !important');
              if (prevButton) prevButton.setAttribute('style', 'display: none !important');
              
              // Add a class to the lightbox container for single items
              const container = document.querySelector('.glightbox-container');
              if (container) container.classList.add('single-item');
            }, 100);
          }
        });
      } catch (error) {
        console.error("Failed to initialize GLightbox:", error);
      }
    };
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      initLightbox();
    }
    
    // Clean up on unmount
    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
      }
    };
  }, [projectId, displayMedia.length]);
  
  // Effect to update height when active index changes
  useEffect(() => {
    if (typeof window !== 'undefined' && activeIndex >= 0) {
      updateSwiperHeight();
      forceResizeSwiper();
    }
  }, [activeIndex, forceUpdate]);
  
  // Effect to handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      updateSwiperHeight();
      forceResizeSwiper();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [swiperInstance]);
  
  // Effect to cleanup Swiper instance on unmount
  useEffect(() => {
    return () => {
      if (swiperInstance && !swiperInstance.destroyed) {
        swiperInstance.destroy(true, true);
      }
    };
  }, [swiperInstance]);
  
  const handleSwiperInit = (swiper: any) => {
    setSwiperInstance(swiper);
    
    // Initial height update after a short delay to ensure images are loaded
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        updateSwiperHeight();
        forceResizeSwiper();
      }, 100);
    }
  };

  const handleSlideChange = (swiper: any) => {
    if (swiper && typeof swiper.activeIndex === 'number') {
      // For loop mode, we need to adjust the activeIndex
      let realIndex = swiper.activeIndex;
      if (swiper.params.loop) {
        realIndex = swiper.realIndex || swiper.activeIndex;
      }
      
      setActiveIndex(realIndex);
      
      // Trigger height adjustment immediately when slide changes
      // This ensures the height transition starts at the same time as the slide transition
      if (typeof window !== 'undefined') {
        forceResizeSwiper();
      }
    }
  };
  
  const handleTransitionEnd = () => {
    // Update height after transition completes
    if (typeof window !== 'undefined') {
      // Use a slight delay to ensure the transition has completed
      setTimeout(() => {
        updateSwiperHeight();
        forceResizeSwiper();
      }, 50);
    }
  };
  
  const openLightbox = (index: number) => {
    // Only attempt to open lightbox if we're in a browser and the lightbox is initialized
    if (typeof window !== 'undefined' && lightboxRef.current) {
      lightboxRef.current.openAt(index);
    }
  };

  return (
    <div className="relative w-full mb-8 media-carousel-container">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={slidesPerView}
        navigation={{
          enabled: displayMedia.length > 1,
          hideOnClick: false,
          disabledClass: 'swiper-button-disabled',
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        watchOverflow={true}
        preventInteractionOnTransition={true}
        effect="fade"
        fadeEffect={{ 
          crossFade: true,
        }}
        loop={shouldLoop}
        autoplay={shouldAutoplay ? {
          delay: 5000, // Display for 5 seconds
          disableOnInteraction: false,
        } : false}
        speed={2000} // 2 second transition
        onInit={handleSwiperInit}
        onSlideChange={handleSlideChange}
        onTransitionEnd={handleTransitionEnd}
        className="w-full media-carousel-swiper"
        autoHeight={false} // Disable autoHeight to use our custom height calculation
        updateOnWindowResize={true}
        observer={true}
        observeParents={true}
      >
        {displayMedia.map((item, index) => (
          <SwiperSlide key={`${item.src}-${index}`} className="media-carousel-slide">
            <div
              className="cursor-pointer relative media-carousel-image-container"
              onClick={() => openLightbox(index)}
            >
              <MediaItemComponent item={item} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Hidden links for GLightbox */}
      <div className="hidden">
        {displayMedia.map((item, index) => (
          <a
            key={`lightbox-${item.src}-${index}`}
            href={item.type === "video" ? getVideoEmbedUrl(item) : item.src}
            className={`glightbox-${projectId}`}
            data-gallery={galleryId}
            data-type={item.type}
            data-description={title}
          >
            {/* Hidden content for GLightbox */}
          </a>
        ))}
      </div>
    </div>
  );
};

export default MediaCarousel; 