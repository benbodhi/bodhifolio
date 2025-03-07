"use client";

import React, { useEffect } from "react";
import type { MediaItem } from "@/lib/projects/types";
import { getVideoEmbedUrl } from "./ProjectMediaUtils";

// Define the props for the lightbox component
export interface ProjectMediaLightboxProps {
  media: MediaItem[];
  galleryId: string;
}

// Store a reference to the lightbox instance
let lightboxInstance: any = null;

/**
 * Ensures the portal root exists and is positioned correctly
 */
const ensurePortalRoot = (): HTMLElement | null => {
  if (typeof window === 'undefined') return null;
  
  // Check if portal root already exists
  let portalRoot = document.getElementById('glightbox-portal-root');
  if (!portalRoot) {
    // Create portal root
    portalRoot = document.createElement('div');
    portalRoot.id = 'glightbox-portal-root';
    
    // Insert it between head and body for better positioning
    const head = document.head;
    head.parentNode?.insertBefore(portalRoot, head.nextSibling);
    
    // Add styles to ensure it's positioned correctly
    const style = document.createElement('style');
    style.textContent = `
      #glightbox-portal-root {
        position: fixed;
        z-index: 999999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      #glightbox-portal-root .glightbox-container {
        pointer-events: auto;
      }
      /* Custom styles for GLightbox */
      .glightbox-container .gslide-media {
        max-width: 85vw !important;
        max-height: 85vh !important;
      }
      .glightbox-container .gslide-image img {
        max-width: 85vw !important;
        max-height: 85vh !important;
        object-fit: contain;
      }
      .glightbox-container .gslide-video {
        width: auto !important;
        max-width: 85vw !important;
        max-height: 85vh !important;
      }
      /* Make sure videos maintain their aspect ratio */
      .glightbox-container .plyr {
        width: 85vh;
        height: auto !important;
        max-width: 85vw !important;
        max-height: 85vh !important;
      }
      .glightbox-container .plyr__video-wrapper {
        height: auto !important;
      }
      .glightbox-container iframe {
        width: 100% !important;
        height: 100% !important;
        min-height: 50vh !important; /* Ensure videos aren't too small */
        aspect-ratio: auto !important; /* Let the video use its natural aspect ratio */
      }
      .glightbox-container .gslide-inline {
        max-width: 85vw !important;
        max-height: 85vh !important;
      }
      /* Ensure navigation buttons don't overlap with content */
      .glightbox-container .gnext, 
      .glightbox-container .gprev {
        margin: 0 20px;
      }
      .glightbox-clean .gnext,
      .glightbox-clean .gprev {
        width: 50px;
        height: 50px;
        border-radius: 100%;
      }
      .glightbox-clean .gnext {
        padding: 0 0 0 4px;
      }
      .glightbox-clean .gprev {
        padding: 0 4px 0 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  return portalRoot;
};

/**
 * Loads CSS dynamically to avoid SSR issues
 */
const loadGLightboxCSS = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if already loaded
  if (document.querySelector('link[href*="glightbox.min.css"]')) return;
  
  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css';
  document.head.appendChild(link);
};

/**
 * ProjectMediaLightbox Component
 * 
 * A lightweight wrapper around GLightbox.
 * 
 * @param {ProjectMediaLightboxProps} props - The component props
 * @returns {JSX.Element | null} The rendered component
 */
const ProjectMediaLightbox: React.FC<ProjectMediaLightboxProps> = () => {
  // Ensure portal root exists and CSS is loaded on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadGLightboxCSS();
      ensurePortalRoot();
    }
  }, []);
  
  // We don't need to render anything as GLightbox creates its own DOM elements
  return null;
};

/**
 * Converts our MediaItem array to GLightbox format
 */
const convertMediaToGLightboxFormat = (media: MediaItem[]) => {
  return media.map((item) => {
    if (item.type === 'image') {
      return {
        type: 'image',
        href: item.src,
        alt: '',
      };
    } else {
      // For videos, use the embed URL
      return {
        type: 'video',
        href: getVideoEmbedUrl(item),
        // No need to specify width/height here as we'll use videosWidth
      };
    }
  });
};

/**
 * Opens a lightbox with the given media items
 * 
 * @param {MediaItem[]} media - The media items to display
 * @param {string} galleryId - A unique ID for the gallery
 * @param {number} index - The index of the item to open
 */
export const openLightbox = (media: MediaItem[], galleryId: string, index: number = 0) => {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Load CSS first
    loadGLightboxCSS();
    
    // Ensure portal root exists and get the element
    const portalRoot = ensurePortalRoot();
    if (!portalRoot) return;
    
    // Dynamically import GLightbox to avoid SSR issues
    (async () => {
      try {
        // Import GLightbox
        const GLightboxModule = await import('glightbox');
        const GLightbox = GLightboxModule.default;
        
        // Close any existing lightbox
        if (lightboxInstance) {
          lightboxInstance.close();
          lightboxInstance.destroy();
          lightboxInstance = null;
        }

        // Convert our media items to GLightbox format
        const elements = convertMediaToGLightboxFormat(media);

        // Create and open a new lightbox with type assertion to avoid TS errors
        lightboxInstance = GLightbox({
          elements: elements as any,
          startAt: index,
          openEffect: 'fade',
          closeEffect: 'fade',
          cssEffects: {
            fade: { in: 'fadeIn', out: 'fadeOut' }
          },
          touchNavigation: true,
          loop: true,
          autoplayVideos: true,
          zoomable: false,
          draggable: true,
          // Responsive design
          moreLength: 0, // No "See more" text
          videosWidth: '85vw', // Set maximum width for videos to match images
          plyr: {
            css: 'https://cdn.plyr.io/3.6.8/plyr.css',
            js: 'https://cdn.plyr.io/3.6.8/plyr.js',
            config: {
              fullscreen: { enabled: true, iosNative: true },
              youtube: { 
                noCookie: true, 
                rel: 0, 
                showinfo: 0, 
                iv_load_policy: 3
              },
              vimeo: { 
                byline: false, 
                portrait: false, 
                title: false, 
                transparent: false
              }
            }
          }
        });

        // After initialization, move the lightbox container to our portal root
        setTimeout(() => {
          const glightboxContainer = document.querySelector('.glightbox-container');
          if (glightboxContainer && portalRoot) {
            // Move the container to our portal root
            portalRoot.appendChild(glightboxContainer);
          }
        }, 0);

        lightboxInstance.open();
      } catch (error) {
        console.error('Failed to load GLightbox:', error);
      }
    })();
  } catch (error) {
    console.error('Failed to open lightbox:', error);
  }
};

// No initialization on import to avoid SSR issues
export default ProjectMediaLightbox; 