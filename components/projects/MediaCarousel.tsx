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
  const [swiperHeight, setSwiperHeight] = useState<string>("auto");
  
  // For empty media array, return nothing
  if (!media || media.length === 0) {
    return null;
  }
  
  // Check if there's a cover image that should be displayed exclusively
  const coverItem = media.find(item => item.isCover);
  const displayMedia = coverItem ? [coverItem] : media;
  const shouldLoop = !coverItem && media.length > 1;
  const shouldAutoplay = !coverItem && media.length > 1;
  
  // Create a unique gallery ID for this project
  const galleryId = `project-gallery-${projectId}`;
  
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
  
  // Handle slide change
  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
    
    // Update swiper height after slide change to match current slide content
    if (swiper && swiper.slides && swiper.slides[swiper.activeIndex]) {
      const currentSlide = swiper.slides[swiper.activeIndex];
      const slideContent = currentSlide.querySelector('.media-carousel-image');
      
      if (slideContent) {
        // Force a reflow to ensure the image has loaded and has proper dimensions
        setTimeout(() => {
          if (swiper && swiper.updateAutoHeight) {
            swiper.updateAutoHeight(0);
          }
        }, 50);
      }
    }
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
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={shouldAutoplay ? {
          delay: 5000,
          disableOnInteraction: false,
        } : false}
        className="media-carousel-swiper"
        onSlideChange={handleSlideChange}
        observer={true}
        observeParents={true}
        autoHeight={true}
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
                      onLoad={() => {
                        // Update swiper height after image loads
                        if (swiperRef.current && swiperRef.current.swiper) {
                          swiperRef.current.swiper.updateAutoHeight(0);
                        }
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
                      onLoad={() => {
                        // Update swiper height after thumbnail loads
                        if (swiperRef.current && swiperRef.current.swiper) {
                          swiperRef.current.swiper.updateAutoHeight(0);
                        }
                      }}
                      onError={(e) => {
                        // If maxresdefault fails, fallback to hqdefault
                        if (item.type === "video" && 
                            (item.videoType === 'youtube' || 
                             (!item.videoType && (item.src.includes("youtube.com") || item.src.includes("youtu.be"))))) {
                          const videoId = extractYouTubeID(item.src);
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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