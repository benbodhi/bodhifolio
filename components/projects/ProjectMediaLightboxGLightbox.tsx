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
      /* Basic GLightbox styling - more specific styles are added in initializeVimeoPlayers */
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
 * Adds necessary CSS styles for Vimeo players and GLightbox
 */
const addVimeoAndLightboxStyles = (): void => {
  // Skip if not in browser environment or styles already added
  if (typeof window === 'undefined' || document.getElementById('vimeo-lightbox-styles')) {
    return;
  }
  
  // Add global styles to ensure proper display
  const styleTag = document.createElement('style');
  styleTag.id = 'vimeo-lightbox-styles';
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
    
    /* Custom Vimeo container styles */
    .vimeo-outer-container {
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
    
    .custom-vimeo-container {
      width: 100% !important;
      height: 100% !important;
      min-width: 640px !important;
      min-height: 360px !important;
    }
    
    /* Ensure the Vimeo iframe maintains aspect ratio */
    .custom-vimeo-container iframe {
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
      loadVimeoPlayerSDK().catch(err => console.error('Failed to load Vimeo Player SDK:', err));
      ensurePortalRoot();
      addVimeoAndLightboxStyles(); // Add styles once during component initialization
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
      // For videos, create a responsive container with proper aspect ratio
      const videoUrl = getVideoEmbedUrl(item);
      
      // Check if this is our special Vimeo ID format
      if (videoUrl.startsWith('vimeo-id://')) {
        const vimeoId = videoUrl.replace('vimeo-id://', '');
        
        // Create a custom container for Vimeo player
        return {
          type: 'inline',
          content: `
            <div class="vimeo-outer-container">
              <div 
                id="vimeo-player-${vimeoId}" 
                class="custom-vimeo-container"
                data-vimeo-id="${vimeoId}"
                data-vimeo-portrait="false"
                data-vimeo-title="false"
                data-vimeo-byline="false"
                data-vimeo-badge="false"
                data-vimeo-dnt="true"
                data-vimeo-responsive="true"
              ></div>
            </div>
          `
        };
      }
      
      // For other videos, use the standard video type
      return {
        type: 'video',
        href: videoUrl,
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
    addVimeoAndLightboxStyles(); // Ensure styles are added
    
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
          // IMPORTANT: This must be false for our custom Vimeo player autoplay to work correctly
          // GLightbox's autoplay interferes with our custom player initialization
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
            
            // Add event listener to adjust container when video is loaded
            const adjustVimeoContainer = () => {
              console.log('Adjusting Vimeo container...');
              
              // Make sure all containers are transparent
              const containers = document.querySelectorAll('.gslide-inner-content, .ginner-container, .gslide-media, .gvideo-wrapper, .gvideo-container, .gslide-inline, .ginlined-content');
              containers.forEach(container => {
                if (container instanceof HTMLElement) {
                  container.style.backgroundColor = 'transparent';
                }
              });
              
              // Find all custom Vimeo containers and initialize players
              const vimeoContainers = document.querySelectorAll('.custom-vimeo-container');
              console.log(`Found ${vimeoContainers.length} custom Vimeo containers`);
              
              if (vimeoContainers.length > 0) {
                // Ensure Vimeo API is loaded
                if (typeof window.Vimeo === 'undefined') {
                  console.log('Vimeo API not loaded yet, loading now...');
                  loadVimeoPlayerSDK().then(() => {
                    initializeCustomVimeoPlayers(vimeoContainers);
                  }).catch(err => console.error('Failed to load Vimeo Player SDK:', err));
                } else {
                  console.log('Vimeo API already loaded, initializing players...');
                  initializeCustomVimeoPlayers(vimeoContainers);
                }
              }
            };
            
            // Helper function to initialize custom Vimeo players
            const initializeCustomVimeoPlayers = (containers: NodeListOf<Element>) => {
              if (typeof window === 'undefined' || !window.Vimeo) return;
              
              containers.forEach(container => {
                if (container instanceof HTMLElement) {
                  try {
                    console.log('Creating Vimeo player for container:', container.id);
                    
                    // Create player with options
                    const player = new window.Vimeo!.Player(container, {
                      id: container.dataset.vimeoId,
                      autoplay: true, // Control autoplay from one place only
                      portrait: false,
                      title: false,
                      byline: false,
                      badge: false,
                      dnt: true,
                      transparent: false,
                      background: false, // Set to false to show controls and enable audio
                      responsive: true
                    });
                    
                    // Note: We're not setting colors here since the error shows the creator has forced a specific color
                    console.log('Initializing Vimeo player with default creator settings');
                    
                    // Get the video dimensions to set the correct size
                    player.getVideoWidth().then((width: number) => {
                      player.getVideoHeight().then((height: number) => {
                        if (width && height) {
                          console.log(`Video dimensions: ${width}x${height}`);
                          
                          // Calculate the aspect ratio
                          const aspectRatio = height / width;
                          
                          // Set the container size based on the video's aspect ratio
                          // while respecting the max-width and max-height constraints
                          const maxWidth = Math.min(width, window.innerWidth * 0.85);
                          const maxHeight = Math.min(height, window.innerHeight * 0.85);
                          
                          // Find the constraining dimension
                          if (maxWidth * aspectRatio <= maxHeight) {
                            // Width is the constraining dimension
                            container.style.width = `${maxWidth}px`;
                            container.style.height = `${maxWidth * aspectRatio}px`;
                          } else {
                            // Height is the constraining dimension
                            container.style.height = `${maxHeight}px`;
                            container.style.width = `${maxHeight / aspectRatio}px`;
                          }
                          
                          // Update the parent container as well
                          const outerContainer = container.closest('.vimeo-outer-container');
                          if (outerContainer instanceof HTMLElement) {
                            outerContainer.style.width = container.style.width;
                            outerContainer.style.height = container.style.height;
                          }
                        }
                      });
                    });
                    
                    // Store the player instance for later use
                    container.vimeoPlayer = player;
                  } catch (error: unknown) {
                    console.error('Failed to initialize Vimeo player:', error);
                  }
                }
              });
            };
            
            // Run once and then on any slide change
            adjustVimeoContainer();
            
            // Track the current slide index to know when to pause videos
            let currentSlideIndex = index;
            
            // Debug all GLightbox events to find the correct ones
            const debugEvents = [
              'glightbox.open',
              'glightbox.close', 
              'glightbox.slide.change',
              'glightbox.slide.before.change',
              'glightbox.slide.before.slide.change',
              'glightbox.slide.before.load',
              'glightbox.slide.loaded',
              'glightbox.slide.prev',
              'glightbox.slide.next'
            ];
            
            debugEvents.forEach(eventName => {
              glightboxContainer.addEventListener(eventName, (event) => {
                console.log(`DEBUG EVENT: ${eventName}`, event);
              });
            });
            
            // Direct approach: listen for all slide navigation events
            glightboxContainer.addEventListener('click', (event) => {
              const target = event.target as HTMLElement;
              // Check if navigation buttons were clicked
              if (target.closest('.gnext') || target.closest('.gprev')) {
                console.log('Navigation button clicked, pausing current video');
                pauseVimeoVideoOnSlide(currentSlideIndex);
              }
            });
            
            // Try both event names
            glightboxContainer.addEventListener('glightbox.slide.before.change', (event) => {
              console.log('BEFORE CHANGE EVENT FIRED!', event);
              pauseVimeoVideoOnSlide(currentSlideIndex);
            });
            
            glightboxContainer.addEventListener('glightbox.slide.change', (event) => {
              // Get the new slide index from the event
              const newSlideIndex = (event as CustomEvent).detail.index;
              console.log(`Slide changed to ${newSlideIndex} from ${currentSlideIndex}`);
              
              // Pause the video on the previous slide as a backup
              pauseVimeoVideoOnSlide(currentSlideIndex);
              
              // Update current slide index
              currentSlideIndex = newSlideIndex;
              
              // Then adjust the new container
              adjustVimeoContainer();
            });
            
            // Also pause videos when closing the lightbox
            glightboxContainer.addEventListener('glightbox.close', () => {
              console.log('Lightbox closing, pausing all videos');
              pauseAllVimeoVideos();
            });
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

/**
 * Pauses Vimeo video on a specific slide
 */
const pauseVimeoVideoOnSlide = (slideIndex: number) => {
  if (typeof window === 'undefined' || !window.Vimeo) return;
  
  try {
    console.log(`Attempting to pause video on slide ${slideIndex}`);
    
    // Find the slide at the given index
    const slide = document.querySelector(`.glightbox-container .gslide:nth-child(${slideIndex + 1})`);
    if (!slide) {
      console.log(`No slide found at index ${slideIndex}`);
      // Fallback: try to pause all videos
      pauseAllVimeoVideos();
      return;
    }
    
    // Find Vimeo containers within this slide
    const vimeoContainers = slide.querySelectorAll('.custom-vimeo-container');
    console.log(`Found ${vimeoContainers.length} Vimeo containers on slide ${slideIndex}`);
    
    if (vimeoContainers.length === 0) {
      console.log('No Vimeo containers found, trying to find all containers');
      // Fallback: try to pause all videos
      pauseAllVimeoVideos();
      return;
    }
    
    vimeoContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        if (container.vimeoPlayer) {
          console.log(`Pausing Vimeo player on slide ${slideIndex}`);
          // Force pause with a timeout to ensure it happens
          setTimeout(() => {
            try {
              container.vimeoPlayer.getPaused().then((isPaused: boolean) => {
                console.log(`Player is ${isPaused ? 'already paused' : 'playing'}`);
                if (!isPaused) {
                  container.vimeoPlayer.pause().then(() => {
                    console.log('Successfully paused video');
                  }).catch((err: Error) => 
                    console.error('Failed to pause Vimeo video:', err)
                  );
                }
              }).catch((err: Error) => console.error('Failed to get pause state:', err));
            } catch (err) {
              console.error('Error in delayed pause:', err);
            }
          }, 0);
        } else {
          console.log('No vimeoPlayer instance found on container');
        }
      }
    });
  } catch (error) {
    console.error('Error pausing Vimeo video on slide:', error);
  }
};

/**
 * Pauses all Vimeo videos in the document
 */
const pauseAllVimeoVideos = () => {
  if (typeof window === 'undefined' || !window.Vimeo) return;
  
  try {
    // Find all custom Vimeo containers
    const vimeoContainers = document.querySelectorAll('.custom-vimeo-container');
    console.log(`Pausing all ${vimeoContainers.length} Vimeo videos`);
    
    vimeoContainers.forEach(container => {
      if (container instanceof HTMLElement && container.vimeoPlayer) {
        container.vimeoPlayer.pause().catch((err: Error) => 
          console.error('Failed to pause Vimeo video:', err)
        );
      }
    });
  } catch (error) {
    console.error('Error pausing all Vimeo videos:', error);
  }
};

// Add type definition for Vimeo Player SDK and extended HTMLElement
declare global {
  interface Window {
    Vimeo?: {
      Player: any;
    };
  }
  
  interface HTMLElement {
    vimeoPlayer?: any;
  }
}

// No initialization on import to avoid SSR issues
export default ProjectMediaLightbox; 