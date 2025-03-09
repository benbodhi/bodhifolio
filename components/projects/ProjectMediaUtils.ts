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
      // Return a special format that will be handled by our custom player
      // We'll use a custom protocol to identify this as a Vimeo ID rather than a URL
      return `vimeo-id://${extractVimeoID(src)}`;
    }
    return src; // Local video
  }
  
  // Otherwise, try to detect from URL
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${extractYouTubeID(src)}?autoplay=1`;
  }
  if (src.includes("vimeo.com")) {
    // Return a special format that will be handled by our custom player
    // We'll use a custom protocol to identify this as a Vimeo ID rather than a URL
    return `vimeo-id://${extractVimeoID(src)}`;
  }
  return src; // Local video
};

/**
 * Gets Vimeo thumbnail URL that preserves aspect ratio
 */
export const getVimeoThumbnailUrl = (vimeoId: string): string => {
  // Use the direct thumbnail URL from Vimeo
  // This will redirect to the actual thumbnail with the correct aspect ratio
  return `https://i.vimeocdn.com/video/${vimeoId}`;
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
      // For Vimeo, let's not try to generate a thumbnail URL
      // Instead, return a special URL that will be handled by the component
      return src;
    }
    return "/images/video-placeholder.jpg"; // Local video
  }
  
  // Otherwise, try to detect from URL
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    const videoId = extractYouTubeID(src);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (src.includes("vimeo.com")) {
    // For Vimeo, let's not try to generate a thumbnail URL
    // Instead, return a special URL that will be handled by the component
    return src;
  }
  return "/images/video-placeholder.jpg"; // Fallback for local videos
};

/**
 * Gets video dimensions from Vimeo's oEmbed API
 * Returns a promise that resolves to an object with width and height
 */
export const getVimeoVideoDimensions = async (vimeoId: string): Promise<{width: number, height: number}> => {
  try {
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
    const data = await response.json();
    return {
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error fetching Vimeo video dimensions:', error);
    // Return default 16:9 aspect ratio dimensions
    return {
      width: 16,
      height: 9
    };
  }
};

/**
 * Gets video dimensions for YouTube videos
 * YouTube videos are typically 16:9, but this could be extended to use the YouTube API
 */
export const getYouTubeVideoDimensions = (): {width: number, height: number} => {
  // Default to 16:9 aspect ratio
  return {
    width: 16,
    height: 9
  };
}; 