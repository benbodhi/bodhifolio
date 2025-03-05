/**
 * Represents a link in a project card
 */
export type ProjectLink = {
  label: string
  url: string
  type: "primary" | "secondary"
}

/**
 * Represents a media item (image or video) in a project
 */
export type MediaItem = {
  type: 'image' | 'video'
  src: string
  isCover?: boolean // Optional flag to mark an item as the cover
}

/**
 * Represents a project with all its metadata and content
 */
export type Project = {
  id: number
  title: string
  description: string
  // Legacy media fields (maintained for backward compatibility)
  image?: string
  images?: string[]
  videoUrl?: string
  // New unified media field
  media?: MediaItem[]
  links?: ProjectLink[]
  listItems?: string[]
  promo?: string
  type: "project" | "software" | "media" | "resource"
}

/**
 * Props for the ProjectCard component
 */
export interface ProjectItemProps {
  project: Project
  isFirstInColumn?: boolean
} 