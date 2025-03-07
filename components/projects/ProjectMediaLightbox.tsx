"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "@/lib/projects/types";
import { getVideoThumbnail, getVideoEmbedUrl } from "./ProjectMediaUtils";

// Define the props for the lightbox component
export interface ProjectMediaLightboxProps {
  media: MediaItem[];
  galleryId: string;
}

// Global state for the lightbox
type LightboxState = {
  isOpen: boolean;
  media: MediaItem[];
  currentIndex: number;
};

let lightboxState: LightboxState = {
  isOpen: false,
  media: [],
  currentIndex: 0
};

console.log("[DEBUG] Initial lightboxState:", JSON.stringify(lightboxState));

// Track if the portal has been initialized
let portalInitialized = false;
// Track if portal initialization is in progress
let portalInitializing = false;
// Promise that resolves when portal is initialized
let portalInitializationPromise: Promise<void> | null = null;

// Function to update the lightbox state
const updateLightboxState = (newState: Partial<LightboxState>) => {
  console.log("[DEBUG] updateLightboxState called with:", JSON.stringify(newState));
  console.log("[DEBUG] Previous lightboxState:", JSON.stringify(lightboxState));
  
  lightboxState = { ...lightboxState, ...newState };
  
  console.log("[DEBUG] Updated lightboxState:", JSON.stringify(lightboxState));
  
  // Trigger a re-render of the portal
  const event = new CustomEvent('lightbox-update');
  window.dispatchEvent(event);
  console.log("[DEBUG] Dispatched lightbox-update event");
};

/**
 * LightboxPortal Component - The actual lightbox UI
 */
const LightboxPortal: React.FC = () => {
  console.log("[DEBUG] LightboxPortal component rendering");
  
  const [state, setState] = useState<LightboxState>({ isOpen: false, media: [], currentIndex: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const wasOpenRef = useRef(false);
  
  console.log("[DEBUG] LightboxPortal state:", JSON.stringify(state));
  console.log("[DEBUG] Current scroll position:", scrollPosition);
  
  // Listen for lightbox state updates
  useEffect(() => {
    console.log("[DEBUG] Setting up lightbox-update event listener");
    
    const handleUpdate = () => {
      console.log("[DEBUG] handleUpdate called, lightboxState:", JSON.stringify(lightboxState));
      setState({ ...lightboxState });
    };
    
    window.addEventListener('lightbox-update', handleUpdate);
    
    return () => {
      console.log("[DEBUG] Removing lightbox-update event listener");
      window.removeEventListener('lightbox-update', handleUpdate);
    };
  }, []);
  
  // Handle body scroll locking
  useEffect(() => {
    console.log("[DEBUG] Body scroll effect triggered, isOpen:", state.isOpen);
    
    if (state.isOpen) {
      // Store current scroll position
      const currentScrollY = window.scrollY;
      console.log("[DEBUG] Storing scroll position:", currentScrollY);
      setScrollPosition(currentScrollY);
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      console.log("[DEBUG] Body scroll locked, styles applied:", {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow
      });
      
      // Update ref to track that lightbox was open
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      // Only restore scroll if we're transitioning from open to closed
      // Restore body scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      console.log("[DEBUG] Body scroll restored, styles reset");
      
      // Restore scroll position
      console.log("[DEBUG] Attempting to restore scroll to position:", scrollPosition);
      window.scrollTo(0, scrollPosition);
      console.log("[DEBUG] After scrollTo, current scroll position:", window.scrollY);
      
      // Reset the ref
      wasOpenRef.current = false;
    } else {
      console.log("[DEBUG] Skipping scroll restoration on initial render");
    }
  }, [state.isOpen, scrollPosition]);
  
  // Handle keyboard navigation
  useEffect(() => {
    console.log("[DEBUG] Setting up keyboard navigation effect");
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("[DEBUG] Key pressed:", e.key, "isOpen:", state.isOpen);
      
      if (!state.isOpen) return;
      
      if (e.key === 'Escape') {
        console.log("[DEBUG] Escape key pressed, closing lightbox");
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && state.media.length > 1) {
        const newIndex = (state.currentIndex - 1 + state.media.length) % state.media.length;
        console.log("[DEBUG] Left arrow pressed, navigating to index:", newIndex);
        navigateTo(newIndex);
      } else if (e.key === 'ArrowRight' && state.media.length > 1) {
        const newIndex = (state.currentIndex + 1) % state.media.length;
        console.log("[DEBUG] Right arrow pressed, navigating to index:", newIndex);
        navigateTo(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log("[DEBUG] Removing keyboard event listener");
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state]);
  
  // Close the lightbox
  const closeLightbox = () => {
    console.log("[DEBUG] closeLightbox called");
    updateLightboxState({ isOpen: false });
  };
  
  // Navigate to a specific index
  const navigateTo = (index: number) => {
    console.log("[DEBUG] navigateTo called with index:", index);
    updateLightboxState({ currentIndex: index });
  };
  
  // Don't render anything if the lightbox is closed
  if (!state.isOpen || state.media.length === 0) {
    console.log("[DEBUG] Lightbox not rendering: isOpen =", state.isOpen, "media length =", state.media.length);
    return null;
  }
  
  // Get the current media item
  const currentItem = state.media[state.currentIndex];
  console.log("[DEBUG] Rendering lightbox with current item:", JSON.stringify(currentItem));
  
  // Render the lightbox
  return createPortal(
    <div 
      className="lightbox-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}
      onClick={() => {
        console.log("[DEBUG] Overlay clicked, closing lightbox");
        closeLightbox();
      }}
    >
      {/* Media content */}
      <div 
        className="lightbox-content"
        style={{
          position: 'relative',
          maxWidth: '100vw',
          maxHeight: '100vh',
          zIndex: 2
        }}
        onClick={(e) => {
          console.log("[DEBUG] Content clicked, stopping propagation");
          e.stopPropagation();
        }}
      >
        {currentItem.type === 'image' ? (
          <img 
            src={currentItem.src}
            alt=""
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              boxShadow: '0 5px 30px rgba(0, 0, 0, 0.3)',
              borderRadius: '4px'
            }}
            onLoad={() => console.log("[DEBUG] Image loaded:", currentItem.src)}
          />
        ) : (
          <div
            style={{
              width: '80vw',
              maxWidth: '1200px',
              aspectRatio: '16/9',
              boxShadow: '0 5px 30px rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              backgroundColor: '#000',
              overflow: 'hidden'
            }}
          >
            <iframe
              src={getVideoEmbedUrl(currentItem)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => console.log("[DEBUG] Video iframe loaded:", getVideoEmbedUrl(currentItem))}
            />
          </div>
        )}
      </div>
      
      {/* Close button */}
      <button
        className="lightbox-close"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 9999999,
          border: 'none',
          padding: 0,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.2s ease'
        }}
        onClick={(e) => {
          console.log("[DEBUG] Close button clicked");
          closeLightbox();
        }}
        onMouseOver={(e) => {
          console.log("[DEBUG] Close button hover in");
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }}
        onMouseOut={(e) => {
          console.log("[DEBUG] Close button hover out");
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      
      {/* Navigation buttons */}
      {state.media.length > 1 && (
        <>
          <button
            className="lightbox-prev"
            style={{
              position: 'absolute',
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 9999999,
              border: 'none',
              padding: 0,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = (state.currentIndex - 1 + state.media.length) % state.media.length;
              console.log("[DEBUG] Previous button clicked, navigating to index:", newIndex);
              navigateTo(newIndex);
            }}
            onMouseOver={(e) => {
              console.log("[DEBUG] Previous button hover in");
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }}
            onMouseOut={(e) => {
              console.log("[DEBUG] Previous button hover out");
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button
            className="lightbox-next"
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 9999999,
              border: 'none',
              padding: 0,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = (state.currentIndex + 1) % state.media.length;
              console.log("[DEBUG] Next button clicked, navigating to index:", newIndex);
              navigateTo(newIndex);
            }}
            onMouseOver={(e) => {
              console.log("[DEBUG] Next button hover in");
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }}
            onMouseOut={(e) => {
              console.log("[DEBUG] Next button hover out");
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </>
      )}
    </div>,
    document.body
  );
};

// Function to initialize the portal
const initializePortal = (): Promise<void> => {
  console.log("[DEBUG] Initializing portal on demand");
  
  // If already initialized, return resolved promise
  if (portalInitialized) {
    console.log("[DEBUG] Portal already initialized");
    return Promise.resolve();
  }
  
  // If initialization is in progress, return the existing promise
  if (portalInitializing && portalInitializationPromise) {
    console.log("[DEBUG] Portal initialization already in progress");
    return portalInitializationPromise;
  }
  
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    console.log("[DEBUG] Not in browser environment, skipping initialization");
    return Promise.resolve();
  }
  
  // Set flag that initialization is in progress
  portalInitializing = true;
  
  // Create and store the initialization promise
  portalInitializationPromise = new Promise<void>((resolve, reject) => {
    // Use dynamic import for React DOM
    import('react-dom/client').then(({ createRoot }) => {
      console.log("[DEBUG] react-dom/client imported successfully");
      
      try {
        // Create a container for the portal if it doesn't exist
        let portalContainer = document.getElementById('lightbox-portal-container');
        if (!portalContainer) {
          console.log("[DEBUG] Portal container not found, creating new one");
          portalContainer = document.createElement('div');
          portalContainer.id = 'lightbox-portal-container';
          document.body.appendChild(portalContainer);
          console.log("[DEBUG] Portal container added to document body");
          
          // Create a root for the portal
          const root = createRoot(portalContainer);
          console.log("[DEBUG] React root created for portal container");
          
          // Render the portal component
          root.render(<LightboxPortal />);
          console.log("[DEBUG] LightboxPortal rendered into root");
        } else {
          console.log("[DEBUG] Portal container already exists");
        }
        
        // Mark as initialized
        portalInitialized = true;
        portalInitializing = false;
        
        // Small delay to ensure the portal is fully rendered
        setTimeout(() => {
          console.log("[DEBUG] Portal initialization complete");
          resolve();
        }, 50);
      } catch (error) {
        console.error('[DEBUG] Error initializing portal:', error);
        portalInitializing = false;
        reject(error);
      }
    }).catch(err => {
      console.error('[DEBUG] Failed to initialize lightbox portal:', err);
      portalInitializing = false;
      reject(err);
    });
  });
  
  return portalInitializationPromise;
};

/**
 * ProjectMediaLightbox Component
 * 
 * A modern implementation using React portals.
 * 
 * @param {ProjectMediaLightboxProps} props - The component props
 * @returns {JSX.Element | null} The rendered component
 */
const ProjectMediaLightbox: React.FC<ProjectMediaLightboxProps> = () => {
  console.log("[DEBUG] ProjectMediaLightbox component rendered");
  return null;
};

/**
 * Opens a lightbox with the given media items
 * 
 * @param {MediaItem[]} media - The media items to display
 * @param {string} galleryId - A unique ID for the gallery
 * @param {number} index - The index of the item to open
 */
export const openLightbox = (media: MediaItem[], galleryId: string, index: number = 0) => {
  console.log("[DEBUG] openLightbox called with:", {
    mediaCount: media.length,
    galleryId,
    index
  });
  
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    console.log("[DEBUG] Not in browser environment, skipping");
    return;
  }
  
  console.log("[DEBUG] Current scroll position before opening:", window.scrollY);
  
  // Initialize the portal if needed and then update the lightbox state
  initializePortal().then(() => {
    console.log("[DEBUG] Portal initialized, now opening lightbox");
    // Update the lightbox state
    updateLightboxState({
      isOpen: true,
      media,
      currentIndex: index
    });
  }).catch(error => {
    console.error("[DEBUG] Failed to initialize portal:", error);
  });
};

// Initialize the portal early but not on page load
if (typeof window !== 'undefined') {
  // Use requestIdleCallback or setTimeout to defer initialization
  const deferredInit = window.requestIdleCallback || setTimeout;
  deferredInit(() => {
    console.log("[DEBUG] Deferred initialization of portal during idle time");
    // Just prepare the portal but don't open the lightbox
    initializePortal().catch(err => {
      console.error("[DEBUG] Error in deferred portal initialization:", err);
    });
  }, { timeout: 2000 });
}

export default ProjectMediaLightbox;