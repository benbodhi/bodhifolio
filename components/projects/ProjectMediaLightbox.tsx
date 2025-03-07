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

// Function to update the lightbox state
const updateLightboxState = (newState: Partial<LightboxState>) => {
  lightboxState = { ...lightboxState, ...newState };
  
  // Trigger a re-render of the portal
  const event = new CustomEvent('lightbox-update');
  window.dispatchEvent(event);
};

/**
 * LightboxPortal Component - The actual lightbox UI
 */
const LightboxPortal: React.FC = () => {
  const [state, setState] = useState<LightboxState>({ isOpen: false, media: [], currentIndex: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const wasOpenRef = useRef(false);
  
  // Listen for lightbox state updates
  useEffect(() => {
    const handleUpdate = () => {
      setState({ ...lightboxState });
    };
    
    window.addEventListener('lightbox-update', handleUpdate);
    
    return () => {
      window.removeEventListener('lightbox-update', handleUpdate);
    };
  }, []);
  
  // Handle body scroll locking
  useEffect(() => {
    if (state.isOpen) {
      // Store current scroll position
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift from scrollbar disappearing
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      wasOpenRef.current = false;
    }
  }, [state.isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isOpen) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && state.media.length > 1) {
        const newIndex = (state.currentIndex - 1 + state.media.length) % state.media.length;
        navigateTo(newIndex);
      } else if (e.key === 'ArrowRight' && state.media.length > 1) {
        const newIndex = (state.currentIndex + 1) % state.media.length;
        navigateTo(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state]);
  
  // Close the lightbox
  const closeLightbox = () => {
    updateLightboxState({ isOpen: false });
  };
  
  // Navigate to a specific index
  const navigateTo = (index: number) => {
    updateLightboxState({ currentIndex: index });
  };
  
  // Don't render anything if the lightbox is closed
  if (!state.isOpen || state.media.length === 0) {
    return null;
  }
  
  // Get the current media item
  const currentItem = state.media[state.currentIndex];
  
  // Create a portal directly to our portal root, not the body
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        pointerEvents: 'all'
      }}
      onClick={closeLightbox}
    >
      <div 
        style={{
          position: 'relative',
          maxWidth: '85vw',
          maxHeight: '85vh',
          height: '85vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentItem.type === 'image' ? (
          <img 
            src={currentItem.src}
            alt=""
            style={{
              maxWidth: '85vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              boxShadow: '0 5px 30px rgba(0, 0, 0, 0.3)',
              borderRadius: '4px'
            }}
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
            />
          </div>
        )}
      </div>
      
      {/* Close button */}
      <button
        style={{
          position: 'absolute',
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
          e.stopPropagation();
          closeLightbox();
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }}
        onMouseOut={(e) => {
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
              navigateTo(newIndex);
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button
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
              navigateTo(newIndex);
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }}
            onMouseOut={(e) => {
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
    // Target the portal root instead of document.body
    document.getElementById('portal-root') || document.body
  );
};

// Create a singleton instance of the portal
let portalInstance: HTMLDivElement | null = null;

// Function to ensure the portal exists
const ensurePortal = (): void => {
  if (typeof window === 'undefined') return;
  
  // First create the portal root if it doesn't exist
  let portalRoot = document.getElementById('portal-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    // Insert it between head and body
    const head = document.head;
    head.parentNode?.insertBefore(portalRoot, head.nextSibling);
  }
  
  if (!portalInstance) {
    portalInstance = document.createElement('div');
    portalInstance.id = 'lightbox-portal';
    portalRoot.appendChild(portalInstance);
    
    const root = require('react-dom/client');
    root.createRoot(portalInstance).render(<LightboxPortal />);
  }
};

// Ensure the portal is created when the component is imported
if (typeof window !== 'undefined') {
  // Use requestIdleCallback or setTimeout to defer initialization
  const deferredInit = window.requestIdleCallback || setTimeout;
  deferredInit(() => {
    ensurePortal();
  }, { timeout: 2000 });
}

/**
 * ProjectMediaLightbox Component
 * 
 * A modern implementation using React portals.
 * 
 * @param {ProjectMediaLightboxProps} props - The component props
 * @returns {JSX.Element | null} The rendered component
 */
const ProjectMediaLightbox: React.FC<ProjectMediaLightboxProps> = () => {
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
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  // Ensure the portal exists
  ensurePortal();
  
  // Update the lightbox state
  updateLightboxState({
    isOpen: true,
    media,
    currentIndex: index
  });
};

export default ProjectMediaLightbox;