"use client";

import React, { useEffect } from "react";
import type { MediaItem } from "@/lib/projects/types";
import { 
  fetchOEmbedData, 
  getVideoProvider, 
  extractVimeoID, 
  extractYouTubeID,
  getModifiedEmbedHtml
} from "./ProjectMediaOEmbedUtils";

// Define the props for the lightbox component
export interface ProjectMediaOEmbedLightboxProps {
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
  let portalRoot = document.getElementById('glightbox-oembed-portal-root');
  if (!portalRoot) {
    // Create portal root
    portalRoot = document.createElement('div');
    portalRoot.id = 'glightbox-oembed-portal-root';
    
    // Insert it between head and body for better positioning
    const head = document.head;
    head.parentNode?.insertBefore(portalRoot, head.nextSibling);
    
    // Add styles to ensure it's positioned correctly
    const style = document.createElement('style');
    style.textContent = `
      #glightbox-oembed-portal-root {
        position: fixed;
        z-index: 999999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      #glightbox-oembed-portal-root .glightbox-container {
        pointer-events: auto;
      }
      /* Basic GLightbox styling */
      .glightbox-container .gslide-media {
        max-width: 85vw !important;
        max-height: 85vh !important;
      }
      .glightbox-container .gslide-image img {
        max-width: 85vw !important;
        max-height: 85vh !important;
        object-fit: contain;
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
 * Loads Vimeo Player SDK dynamically
 */
const loadVimeoPlayerSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    // Check if already loaded
    if (document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
      resolve();
      return;
    }
    
    // Load the Vimeo Player SDK
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Loads GLightbox script dynamically
 */
const loadGLightboxScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    // Check if already loaded
    if (window.GLightbox) {
      resolve();
      return;
    }
    
    // Check if script tag already exists
    if (document.querySelector('script[src*="glightbox.min.js"]')) {
      // Script tag exists but might not be loaded yet
      const checkGLightbox = () => {
        if (window.GLightbox) {
          resolve();
        } else {
          setTimeout(checkGLightbox, 100);
        }
      };
      checkGLightbox();
      return;
    }
    
    // Load the GLightbox script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/mcstudios/glightbox/dist/js/glightbox.min.js';
    script.async = true;
    script.onload = () => {
      // Make sure GLightbox is actually available
      const checkGLightbox = () => {
        if (window.GLightbox) {
          resolve();
        } else {
          setTimeout(checkGLightbox, 100);
        }
      };
      checkGLightbox();
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Adds necessary CSS styles for oEmbed players and GLightbox
 */
const addOEmbedLightboxStyles = (): void => {
  // Skip if not in browser environment or styles already added
  if (typeof window === 'undefined' || document.getElementById('oembed-lightbox-styles')) {
    return;
  }
  
  // Add global styles to ensure proper display
  const styleTag = document.createElement('style');
  styleTag.id = 'oembed-lightbox-styles';
  styleTag.textContent = `
    /* Make all GLightbox containers transparent */
    .glightbox-container .gslide-inner-content,
    .glightbox-container .ginner-container,
    .glightbox-container .gslide-desc,
    .glightbox-container .gslide-description,
    .glightbox-container .gslide-title,
    .glightbox-container .gslide-media,
    .glightbox-container .gvideo-wrapper,
    .glightbox-container .gvideo-container,
    .glightbox-container .gslide-inline,
    .glightbox-container .ginlined-content {
      background-color: transparent !important;
    }
    
    /* Make the video background transparent */
    .glightbox-container iframe,
    .glightbox-container .gvideo-wrapper iframe {
      background-color: transparent !important;
    }
    
    /* Custom oEmbed container styles */
    .oembed-outer-container {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      background-color: #000000 !important;
      max-width: 85vw !important;
      max-height: 85vh !important;
      position: relative !important;
      width: auto !important;
      height: auto !important;
    }
    
    .custom-oembed-container {
      width: 100% !important;
      height: 100% !important;
      min-width: 640px !important;
      min-height: 360px !important;
    }
    
    /* Ensure the iframe maintains aspect ratio */
    .custom-oembed-container iframe {
      width: 100% !important;
      height: 100% !important;
    }
    
    /* Fix for GLightbox inline content */
    .glightbox-container .ginlined-content {
      padding: 0 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      width: auto !important;
      height: auto !important;
    }
    
    /* Ensure the iframe container maintains its aspect ratio */
    .glightbox-container .gslide-inline {
      width: auto !important;
      height: auto !important;
      max-width: 85vw !important;
      max-height: 85vh !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(styleTag);
};

/**
 * ProjectMediaOEmbedLightbox Component
 * 
 * A lightweight wrapper around GLightbox using oEmbed data.
 * 
 * @param {ProjectMediaOEmbedLightboxProps} props - The component props
 * @returns {JSX.Element | null} The rendered component
 */
const ProjectMediaOEmbedLightbox: React.FC<ProjectMediaOEmbedLightboxProps> = () => {
  // Ensure portal root exists and CSS is loaded on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadGLightboxCSS();
      loadGLightboxScript().catch(err => console.error('Failed to load GLightbox:', err));
      loadVimeoPlayerSDK().catch(err => console.error('Failed to load Vimeo Player SDK:', err));
      ensurePortalRoot();
      addOEmbedLightboxStyles(); // Add styles once during component initialization
    }
  }, []);
  
  // We don't need to render anything as GLightbox creates its own DOM elements
  return null;
};

/**
 * Converts our MediaItem array to GLightbox format using oEmbed data
 */
const convertMediaToGLightboxFormat = async (media: MediaItem[]) => {
  const elements = [];
  
  for (const item of media) {
    if (item.type === 'image') {
      elements.push({
        type: 'image',
        href: item.src,
        alt: '',
      });
    } else {
      // For videos, use oEmbed data if available
      const provider = getVideoProvider(item);
      
      if (provider === 'vimeo') {
        // For Vimeo, create a custom slide with oEmbed HTML
        const oembedData = await fetchOEmbedData(item);
        const embedHtml = await getModifiedEmbedHtml(item, { autoplay: true });
        
        // Calculate aspect ratio - default to 16/9 if not available
        const width = oembedData?.width || 16;
        const height = oembedData?.height || 9;
        const aspectRatio = `${width}/${height}`;
        
        if (embedHtml) {
          // Use the oEmbed HTML directly
          elements.push({
            type: 'inline',
            content: `
              <div class="oembed-outer-container" style="aspect-ratio: ${aspectRatio};">
                <div class="custom-oembed-container">
                  ${embedHtml}
                </div>
              </div>
            `
          });
        } else {
          // Fallback to manual embedding
          const vimeoId = extractVimeoID(item.src);
          elements.push({
            type: 'inline',
            content: `
              <div class="oembed-outer-container" style="aspect-ratio: ${aspectRatio};">
                <div class="custom-oembed-container">
                  <iframe 
                    src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen
                  ></iframe>
                </div>
              </div>
            `
          });
        }
      } else if (provider === 'youtube') {
        // For YouTube, create a custom slide with oEmbed HTML
        const oembedData = await fetchOEmbedData(item);
        const embedHtml = await getModifiedEmbedHtml(item, { autoplay: "1" });
        
        // Calculate aspect ratio - default to 16/9 if not available
        const width = oembedData?.width || 16;
        const height = oembedData?.height || 9;
        const aspectRatio = `${width}/${height}`;
        
        if (embedHtml) {
          // Use the oEmbed HTML directly
          elements.push({
            type: 'inline',
            content: `
              <div class="oembed-outer-container" style="aspect-ratio: ${aspectRatio};">
                <div class="custom-oembed-container">
                  ${embedHtml}
                </div>
              </div>
            `
          });
        } else {
          // Fallback to manual embedding
          const youtubeId = extractYouTubeID(item.src);
          elements.push({
            type: 'inline',
            content: `
              <div class="oembed-outer-container" style="aspect-ratio: ${aspectRatio};">
                <div class="custom-oembed-container">
                  <iframe 
                    src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                  ></iframe>
                </div>
              </div>
            `
          });
        }
      } else {
        // For local videos, use a standard video element
        elements.push({
          type: 'video',
          source: item.src,
        });
      }
    }
  }
  
  return elements;
};

/**
 * Opens a lightbox with the specified media items
 * 
 * @param {MediaItem[]} media - The media items to display
 * @param {string} galleryId - A unique ID for the gallery
 * @param {number} index - The index of the item to show first
 */
export const openLightbox = async (media: MediaItem[], galleryId: string, index: number = 0) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Make sure GLightbox is loaded
    await loadGLightboxScript();
    
    // Make sure Vimeo Player SDK is loaded
    await loadVimeoPlayerSDK();
    
    // Make sure portal root exists
    const portalRoot = ensurePortalRoot();
    if (!portalRoot) return;
    
    // Close any existing lightbox
    if (lightboxInstance) {
      try {
        lightboxInstance.close();
      } catch (error) {
        console.error('Error closing existing lightbox:', error);
      }
      lightboxInstance = null;
    }
    
    // Convert our media items to GLightbox format
    const elements = await convertMediaToGLightboxFormat(media);
    
    // Create and open a new lightbox with type assertion to avoid TS errors
    if (window.GLightbox) {
      lightboxInstance = window.GLightbox({
        elements: elements as any,
        startAt: index,
        openEffect: 'fade',
        closeEffect: 'fade',
        cssEffects: {
          fade: { in: 'fadeIn', out: 'fadeOut' }
        },
        touchNavigation: true,
        loop: true,
        // IMPORTANT: This must be false for our custom player autoplay to work correctly
        autoplayVideos: false,
        zoomable: false,
        draggable: true,
        // Responsive design
        moreLength: 0, // No "See more" text
        // Empty plyr config to use native video players
        plyr: {}
      });
      
      // After initialization, move the lightbox container to our portal root
      setTimeout(() => {
        const glightboxContainer = document.querySelector('.glightbox-container');
        if (glightboxContainer && portalRoot) {
          // Move the container to our portal root
          portalRoot.appendChild(glightboxContainer);
        }
      }, 100);
      
      // Open the lightbox
      lightboxInstance.open();
    }
    
  } catch (error) {
    console.error('Error opening lightbox:', error);
  }
};

export default ProjectMediaOEmbedLightbox;

// Add global type definition for GLightbox
declare global {
  interface Window {
    GLightbox: any;
    Vimeo?: {
      Player: any;
    };
  }
} 