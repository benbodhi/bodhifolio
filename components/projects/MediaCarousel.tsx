"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";
import { MediaItem } from "@/lib/projects/types";
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

const MediaCarousel = ({ media, title, projectId }: MediaCarouselProps) => {
  const lightboxRef = useRef<any>(null);
  const [lightboxInitialized, setLightboxInitialized] = useState(false);
  const swiperRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Add state to force re-renders
  
  // For empty media array, return nothing
  if (!media || media.length === 0) {
    return null;
  }
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  const displayMedia = coverItem ? [coverItem] : media;

  // Only enable loop mode if there are at least 3 slides
  const hasEnoughSlidesForLoop = displayMedia.length >= 3;
  const shouldLoop = !coverItem && hasEnoughSlidesForLoop;
  const shouldAutoplay = !coverItem && displayMedia.length > 1;
  
  // Create a unique gallery ID for this project
  const galleryId = `project-gallery-${projectId}`;
  
  // Safely update the swiper height
  const updateSwiperHeight = () => {
    if (swiperInstance && typeof swiperInstance.updateAutoHeight === 'function') {
      try {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          // Check if swiper is still valid before updating
          if (swiperInstance && !swiperInstance.destroyed) {
            swiperInstance.updateAutoHeight();
            
            // Force a re-render after a short delay to ensure height is updated
            setTimeout(() => {
              setForceUpdate(prev => prev + 1);
            }, 50);
          }
        });
      } catch (error) {
        console.error("Error updating swiper height:", error);
      }
    }
  };
  
  // Force resize the swiper container to match the current slide
  const forceResizeSwiper = () => {
    if (!swiperInstance || swiperInstance.destroyed) return;
    
    try {
      // Safely check if slides and activeIndex exist
      if (!swiperInstance.slides || typeof swiperInstance.activeIndex !== 'number') return;
      
      // Get the correct slide index (handle loop mode)
      let slideIndex = swiperInstance.activeIndex;
      if (swiperInstance.params.loop && typeof swiperInstance.realIndex === 'number') {
        // In loop mode, find the non-duplicate slide with the real index
        for (let i = 0; i < swiperInstance.slides.length; i++) {
          const slide = swiperInstance.slides[i];
          if (!slide.classList.contains('swiper-slide-duplicate') && 
              i === swiperInstance.realIndex) {
            slideIndex = i;
            break;
          }
        }
      }
      
      const activeSlide = swiperInstance.slides[slideIndex];
      if (!activeSlide) return;
      
      const slideContent = activeSlide.querySelector('.media-carousel-image');
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
        
        // Apply the height to the swiper container
        if (swiperInstance.el) {
          swiperInstance.el.style.height = `${calculatedHeight}px`;
        }
        
        // Update swiper
        if (typeof swiperInstance.updateSize === 'function') {
          swiperInstance.updateSize();
        }
        if (typeof swiperInstance.updateSlides === 'function') {
          swiperInstance.updateSlides();
        }
        
        // Force update after a short delay
        setTimeout(() => {
          if (swiperInstance && !swiperInstance.destroyed) {
            if (typeof swiperInstance.updateSize === 'function') {
              swiperInstance.updateSize();
            }
            if (typeof swiperInstance.updateSlides === 'function') {
              swiperInstance.updateSlides();
            }
          }
        }, 50);
      }
    } catch (error) {
      console.error("Error forcing resize:", error);
    }
  };
  
  useEffect(() => {
    // Dynamically import GLightbox only on the client side
    const initLightbox = async () => {
      try {
        // Dynamic import of GLightbox
        const GLightboxModule = await import('glightbox');
        const GLightbox = GLightboxModule.default;
        
        // Initialize GLightbox with options to respect natural aspect ratios
        lightboxRef.current = GLightbox({
          selector: `.glightbox-${projectId}`, // Use project-specific selector
          touchNavigation: true,
          loop: shouldLoop,
          autoplayVideos: true,
          videosWidth: 'auto', // Changed from fixed width to auto
          descPosition: 'none', // Don't show descriptions to avoid white bar
          preload: true, // Preload content for better aspect ratio handling
          // Use any type to bypass TypeScript checking for plyr options
          plyr: {
            ratio: undefined, // Allow natural aspect ratio
            config: {
              ratio: undefined, // Allow natural aspect ratio
              fullscreen: { enabled: true, iosNative: true },
              youtube: { noCookie: true, rel: 0, showinfo: 0 },
              vimeo: { byline: false, portrait: false, title: false }
            }
          } as any
        } as any); // Use type assertion for the entire options object
        
        // Add event listeners after initialization
        if (lightboxRef.current) {
          // Force resize on slide change
          lightboxRef.current.on('slide_changed', () => {
            setTimeout(() => {
              if (lightboxRef.current) {
                lightboxRef.current.resize();
              }
            }, 100);
          });
          
          // Force resize after opening
          lightboxRef.current.on('open', () => {
            setTimeout(() => {
              if (lightboxRef.current) {
                lightboxRef.current.resize();
              }
            }, 100);
          });
        }
        
        setLightboxInitialized(true);
        
        // Cleanup on unmount
        return () => {
          if (lightboxRef.current) {
            lightboxRef.current.destroy();
          }
        };
      } catch (error) {
        console.error("Failed to initialize GLightbox:", error);
      }
    };
    
    // Initialize lightbox
    initLightbox();
    
    // Cleanup function
    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
      }
    };
  }, [shouldLoop, projectId]);
  
  // Effect to update height when active index changes
  useEffect(() => {
    if (activeIndex >= 0) {
      updateSwiperHeight();
      forceResizeSwiper();
    }
  }, [activeIndex, forceUpdate]);
  
  // Effect to handle window resize
  useEffect(() => {
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
  
  // Handle slide change
  const handleSlideChange = (swiper: any) => {
    if (swiper && typeof swiper.activeIndex === 'number') {
      // For loop mode, we need to adjust the activeIndex
      let realIndex = swiper.activeIndex;
      if (swiper.params.loop) {
        realIndex = swiper.realIndex || swiper.activeIndex;
      }
      
      setActiveIndex(realIndex);
      
      // Force update the slide visibility
      if (swiper.slides) {
        for (let i = 0; i < swiper.slides.length; i++) {
          const slide = swiper.slides[i];
          
          // In loop mode, we need to check against realIndex
          const isActive = swiper.params.loop 
            ? (swiper.realIndex === i || (swiper.activeIndex === i && !slide.classList.contains('swiper-slide-duplicate')))
            : (i === swiper.activeIndex);
          
          if (isActive) {
            slide.style.opacity = '1';
            slide.style.zIndex = '2';
            slide.style.position = 'relative';
          } else {
            slide.style.opacity = '0';
            slide.style.zIndex = '1';
            slide.style.position = 'absolute';
          }
        }
      }
    }
  };
  
  // Handle swiper initialization
  const handleSwiperInit = (swiper: any) => {
    setSwiperInstance(swiper);
    
    // Initial height update after a short delay to ensure images are loaded
    setTimeout(() => {
      updateSwiperHeight();
      forceResizeSwiper();
    }, 100);
  };
  
  // Handle transition end
  const handleTransitionEnd = () => {
    // Update height after transition completes
    updateSwiperHeight();
    forceResizeSwiper();
  };
  
  return (
    <div className="media-carousel-container">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={media.length > 1}
        loop={shouldLoop}
        loopAdditionalSlides={2}
        effect="fade"
        fadeEffect={{ 
          crossFade: true,
        }}
        autoplay={shouldAutoplay ? {
          delay: 5000,
          disableOnInteraction: false,
        } : false}
        className="media-carousel-swiper"
        onSlideChange={handleSlideChange}
        onSwiper={handleSwiperInit}
        onTransitionEnd={handleTransitionEnd}
        observer={true}
        observeParents={true}
        autoHeight={true}
        updateOnWindowResize={true}
        resizeObserver={true}
        speed={500}
        watchSlidesProgress={true}
        preventInteractionOnTransition={true}
        runCallbacksOnInit={true}
        allowTouchMove={media.length > 1}
        simulateTouch={media.length > 1}
        initialSlide={0}
        virtual={false}
      >
        {displayMedia.map((item, index) => {
          const thumbnailSrc = item.type === "video" ? getVideoThumbnail(item) : item.src;
          
          return (
            <SwiperSlide key={`${item.type}-${item.src}-${index}`} className="media-carousel-slide">
              {item.type === "image" ? (
                <a 
                  href={item.src} 
                  className={`glightbox-${projectId} media-item`}
                  data-gallery={galleryId}
                  data-type="image"
                  data-description={title}
                  data-width="auto"
                  data-height="auto"
                >
                  <div className="media-carousel-image-container">
                    <img
                      src={item.src}
                      alt={`${title} - Image ${index + 1}`}
                      className="media-carousel-image"
                      loading="lazy"
                      onLoad={(e) => {
                        // Update swiper height after image loads
                        updateSwiperHeight();
                        forceResizeSwiper();
                        
                        // Force update after a short delay
                        setTimeout(() => {
                          updateSwiperHeight();
                          forceResizeSwiper();
                        }, 100);
                      }}
                    />
                  </div>
                </a>
              ) : (
                <a
                  href={getVideoEmbedUrl(item)}
                  className={`glightbox-${projectId} media-item`}
                  data-gallery={galleryId}
                  data-type="video"
                  data-description={title}
                  data-width="auto"
                  data-height="auto"
                >
                  <div className="media-carousel-video-container">
                    <img
                      src={thumbnailSrc}
                      alt={`${title} - Video ${index + 1}`}
                      className="media-carousel-image"
                      loading="lazy"
                      onLoad={(e) => {
                        // Update swiper height after thumbnail loads
                        updateSwiperHeight();
                        forceResizeSwiper();
                        
                        // Force update after a short delay
                        setTimeout(() => {
                          updateSwiperHeight();
                          forceResizeSwiper();
                        }, 100);
                      }}
                      onError={(e) => {
                        // If maxresdefault fails, fallback to hqdefault
                        if (item.type === "video" && 
                            (item.videoType === 'youtube' || 
                             (!item.videoType && (item.src.includes("youtube.com") || item.src.includes("youtu.be"))))) {
                          const videoId = extractYouTubeID(item.src);
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                          
                          // Update height after fallback image loads
                          (e.target as HTMLImageElement).onload = () => {
                            updateSwiperHeight();
                            forceResizeSwiper();
                          };
                        }
                      }}
                    />
                    <div className="media-carousel-play-button hover-only">
                      <div className="media-carousel-play-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default MediaCarousel; 