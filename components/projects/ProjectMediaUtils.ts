import type { MediaItem } from "@/lib/projects/types";

/**
 * Extracts YouTube Video ID from a URL
 */
export const extractYouTubeID = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : "";
};

/**
 * Extracts Vimeo Video ID from a URL
 */
export const extractVimeoID = (url: string): string => {
  const match = url.match(/(?:vimeo\.com\/)([^&?/]+)/);
  return match ? match[1] : "";
};

/**
 * Gets the appropriate embed URL for videos
 */
export const getVideoEmbedUrl = (item: MediaItem): string => {
  const { src, videoType } = item;
  
  // If videoType is explicitly set, use it
  if (videoType) {
    if (videoType === 'youtube') {
      return `https://www.youtube.com/embed/${extractYouTubeID(src)}?autoplay=1`;
    }
    if (videoType === 'vimeo') {
      // Use specific Vimeo parameters to control player dimensions
      // responsive=1 ensures the player maintains the video's aspect ratio
      // transparent=1 removes the background
      return `https://player.vimeo.com/video/${extractVimeoID(src)}?autoplay=1&transparent=1&portrait=0&title=0&byline=0&badge=0&autopause=0&dnt=1&responsive=1`;
    }
    return src; // Local video
  }
  
  // Otherwise, try to detect from URL
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${extractYouTubeID(src)}?autoplay=1`;
  }
  if (src.includes("vimeo.com")) {
    // Use specific Vimeo parameters to control player dimensions
    // responsive=1 ensures the player maintains the video's aspect ratio
    // transparent=1 removes the background
    return `https://player.vimeo.com/video/${extractVimeoID(src)}?autoplay=1&transparent=1&portrait=0&title=0&byline=0&badge=0&autopause=0&dnt=1&responsive=1`;
  }
  return src; // Local video
};

/**
 * Gets the appropriate thumbnail URL for videos
 */
export const getVideoThumbnail = (item: MediaItem): string => {
  const { src, videoType, thumbnailUrl } = item;
  
  // If thumbnailUrl is explicitly set, use it
  if (thumbnailUrl) {
    return thumbnailUrl;
  }
  
  // If videoType is explicitly set, use it
  if (videoType) {
    if (videoType === 'youtube') {
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
    const videoId = extractYouTubeID(src);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (src.includes("vimeo.com")) {
    return `https://vumbnail.com/${extractVimeoID(src)}.jpg`;
  }
  return "/images/video-placeholder.jpg"; // Fallback for local videos
}; 