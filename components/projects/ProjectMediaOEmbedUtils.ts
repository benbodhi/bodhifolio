/**
 * ProjectMediaOEmbedUtils.ts
 * 
 * Utility functions for working with oEmbed APIs for different video providers.
 * This file provides functions to fetch oEmbed data, extract metadata, and handle
 * caching to avoid redundant API calls.
 */

import type { MediaItem } from "@/lib/projects/types";

// Type definitions for oEmbed responses
export interface OEmbedResponse {
  type: string;
  version: string;
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  cache_age?: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  width: number;
  height: number;
  html?: string;
}

// Cache for oEmbed responses to avoid redundant API calls
const oembedCache: Record<string, OEmbedResponse> = {};

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
 * Determines the video provider from a URL or MediaItem
 */
export const getVideoProvider = (item: MediaItem | string): 'youtube' | 'vimeo' | 'local' => {
  const url = typeof item === 'string' ? item : item.src;
  const videoType = typeof item === 'string' ? undefined : item.videoType;
  
  // If videoType is explicitly set, use it
  if (videoType) {
    return videoType;
  }
  
  // Otherwise, try to detect from URL
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return 'youtube';
  }
  if (url.includes("vimeo.com")) {
    return 'vimeo';
  }
  return 'local';
};

/**
 * Gets the oEmbed URL for a video based on its provider
 */
export const getOEmbedUrl = (item: MediaItem | string): string => {
  const url = typeof item === 'string' ? item : item.src;
  const provider = getVideoProvider(item);
  
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    case 'vimeo':
      return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    default:
      return '';
  }
};

/**
 * Fetches oEmbed data for a video
 * Returns a promise that resolves to an OEmbedResponse
 */
export const fetchOEmbedData = async (item: MediaItem | string): Promise<OEmbedResponse | null> => {
  const url = typeof item === 'string' ? item : item.src;
  const provider = getVideoProvider(item);
  
  // Return null for local videos
  if (provider === 'local') {
    return null;
  }
  
  // Check cache first
  const cacheKey = url;
  if (oembedCache[cacheKey]) {
    return oembedCache[cacheKey];
  }
  
  try {
    const oembedUrl = getOEmbedUrl(item);
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch oEmbed data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    oembedCache[cacheKey] = data;
    
    return data;
  } catch (error) {
    console.error('Error fetching oEmbed data:', error);
    return null;
  }
};

/**
 * Gets video dimensions from oEmbed data
 * Returns a promise that resolves to an object with width and height
 */
export const getVideoDimensions = async (item: MediaItem | string): Promise<{width: number, height: number}> => {
  const data = await fetchOEmbedData(item);
  
  if (data && data.width && data.height) {
    return {
      width: data.width,
      height: data.height
    };
  }
  
  // Return default 16:9 aspect ratio dimensions if oEmbed data is not available
  return {
    width: 16,
    height: 9
  };
};

/**
 * Gets the aspect ratio from oEmbed data
 * Returns a promise that resolves to a string in the format "width/height"
 */
export const getAspectRatio = async (item: MediaItem | string): Promise<string> => {
  const dimensions = await getVideoDimensions(item);
  return `${dimensions.width}/${dimensions.height}`;
};

/**
 * Gets the thumbnail URL from oEmbed data
 * Returns a promise that resolves to a thumbnail URL
 */
export const getThumbnailUrl = async (item: MediaItem | string): Promise<string | null> => {
  // If item is a MediaItem and has a thumbnailUrl, use it
  if (typeof item !== 'string' && item.thumbnailUrl) {
    return item.thumbnailUrl;
  }
  
  const data = await fetchOEmbedData(item);
  
  if (data && data.thumbnail_url) {
    // For Vimeo, we can request a specific size to match the video dimensions
    if (getVideoProvider(item) === 'vimeo' && data.width && data.height) {
      // Get the largest dimension to ensure quality
      const maxDimension = Math.max(data.width, data.height);
      const size = maxDimension >= 1280 ? 1280 : (maxDimension >= 640 ? 640 : maxDimension);
      
      // Replace the size in the thumbnail URL
      // Vimeo thumbnail URLs typically look like: https://i.vimeocdn.com/video/12345_295x166.jpg
      const baseUrl = data.thumbnail_url.split('_')[0];
      return `${baseUrl}_${size}x${Math.round(size * (data.height / data.width))}.jpg`;
    }
    
    return data.thumbnail_url;
  }
  
  // If oEmbed data is not available or doesn't have a thumbnail_url,
  // fall back to default thumbnail URLs
  const provider = getVideoProvider(item);
  const url = typeof item === 'string' ? item : item.src;
  
  switch (provider) {
    case 'youtube':
      const youtubeId = extractYouTubeID(url);
      // Use maxresdefault for highest quality
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    case 'vimeo':
      // We couldn't get the thumbnail from oEmbed, so we can't provide a fallback
      return null;
    default:
      return '/images/video-placeholder.jpg';
  }
};

/**
 * Gets the embed HTML from oEmbed data
 * Returns a promise that resolves to an HTML string
 */
export const getEmbedHtml = async (item: MediaItem | string): Promise<string | null> => {
  const data = await fetchOEmbedData(item);
  
  if (data && data.html) {
    return data.html;
  }
  
  return null;
};

/**
 * Gets the embed URL for a video based on its provider
 * This is similar to the existing getVideoEmbedUrl function but uses oEmbed data
 */
export const getVideoEmbedUrl = async (item: MediaItem | string): Promise<string> => {
  const url = typeof item === 'string' ? item : item.src;
  const provider = getVideoProvider(item);
  
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${extractYouTubeID(url)}?autoplay=1`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${extractVimeoID(url)}?autoplay=1`;
    default:
      return url; // Local video
  }
};

/**
 * Extracts the iframe src from oEmbed HTML
 * This is useful for getting the embed URL from oEmbed data
 */
export const extractIframeSrc = (html: string): string | null => {
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : null;
};

/**
 * Modifies the iframe src to add autoplay and other parameters
 */
export const modifyIframeSrc = (src: string, params: Record<string, string | boolean>): string => {
  const url = new URL(src);
  
  // Add each parameter to the URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value.toString());
  });
  
  return url.toString();
};

/**
 * Gets the modified embed HTML with autoplay and other parameters
 */
export const getModifiedEmbedHtml = async (
  item: MediaItem | string, 
  params: Record<string, string | boolean> = { autoplay: true }
): Promise<string | null> => {
  const html = await getEmbedHtml(item);
  
  if (!html) {
    return null;
  }
  
  const src = extractIframeSrc(html);
  
  if (!src) {
    return html;
  }
  
  const modifiedSrc = modifyIframeSrc(src, params);
  
  // Replace the src in the HTML
  return html.replace(src, modifiedSrc);
}; 