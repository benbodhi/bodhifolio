"use client";

import React from "react";
import type { MediaItem } from "@/lib/projects/types";
import ProjectMediaOEmbedCarousel from "./ProjectMediaOEmbedCarousel";
import ProjectMediaOEmbedLightbox from "./ProjectMediaOEmbedLightbox";

export interface ProjectMediaOEmbedIntegrationProps {
  media: MediaItem[];
  projectId: string;
  useOEmbed?: boolean; // Flag to toggle between oEmbed and original implementation
}

/**
 * Integration component for the oEmbed-based media carousel and lightbox
 * 
 * This component can be used as a drop-in replacement for the original
 * ProjectMediaCarousel component, with an option to toggle between
 * the original and oEmbed implementations.
 */
const ProjectMediaOEmbedIntegration: React.FC<ProjectMediaOEmbedIntegrationProps> = ({
  media,
  projectId,
  useOEmbed = true
}) => {
  // If useOEmbed is false, import and use the original implementation
  if (!useOEmbed) {
    // We use dynamic import to avoid circular dependencies
    const ProjectMediaCarousel = React.lazy(() => import("./ProjectMediaCarousel"));
    
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ProjectMediaCarousel media={media} projectId={projectId} />
      </React.Suspense>
    );
  }
  
  // Otherwise, use the oEmbed implementation
  return (
    <>
      {/* Render the carousel */}
      <ProjectMediaOEmbedCarousel media={media} projectId={projectId} />
      
      {/* Render the lightbox component (it doesn't actually render anything visible) */}
      <ProjectMediaOEmbedLightbox media={media} galleryId={`oembed-${projectId}`} />
    </>
  );
};

export default ProjectMediaOEmbedIntegration; 