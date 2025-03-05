/**
 * Represents a link in a project card
 */
export type ProjectLink = {
  label: string
  url: string
  type: "primary" | "secondary"
}

/**
 * Represents a project with all its metadata and content
 */
export type Project = {
  id: number
  title: string
  description: string
  image?: string
  images?: string[]
  videoUrl?: string
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