"use client"

import { useEffect, useState, useCallback } from "react"
import { ProjectCard } from "./ProjectCard"
import { Project } from "@/lib/projects/types"
import { ShuffleButton } from "@/components/ui/ShuffleButton"

/**
 * Helper function to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

/**
 * Props for the ProjectGrid component
 */
interface ProjectGridProps {
  /**
   * Initial list of projects to display in the grid
   */
  initialProjects: Project[]
}

export function ProjectGrid({ initialProjects = [] }: ProjectGridProps) {
  // Ensure we have a valid array
  const projects = Array.isArray(initialProjects) ? initialProjects : [];
  
  // Track if we're hydrating or have hydrated
  const [hasHydrated, setHasHydrated] = useState(false);
  
  // Use a lazy initializer for useState to ensure the shuffle only happens once
  // This function will only be called once during the initial render
  const [order, setOrder] = useState(() => {
    // Create indices array and shuffle it
    return shuffleArray(Array.from({ length: projects.length }, (_, i) => i));
  });

  // Set hasHydrated to true once mounted
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleShuffle = useCallback(() => {
    setOrder(shuffleArray([...order]));
  }, [order]);

  // Map order to projects
  const orderedProjects = order.map(i => projects[i]);

  // Only render content when we're on the server or have hydrated
  // This prevents the flash of unshuffled content
  if (typeof window !== 'undefined' && !hasHydrated) {
    return null; // Return nothing during client-side hydration before hydration completes
  }

  return (
    <section className="w-full">
      <div className="sticky top-4 z-40 container mx-auto px-4 mb-12">
        <div className="flex justify-center">
          <ShuffleButton onClick={handleShuffle} />
        </div>
      </div>

      <div className="w-full relative bg-[hsl(var(--border))]">
        {/* Single column layout */}
        <div className="md:hidden">
          <div className="bg-[hsl(var(--background))]">
            {orderedProjects.map((project, index) => (
              <ProjectCard 
                key={project.id}
                project={project}
                isFirstInColumn={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Two column layout */}
        <div className="hidden md:flex xl:hidden gap-[1px]">
          <div className="w-full bg-[hsl(var(--background))]">
            {orderedProjects
              .slice(0, Math.ceil(orderedProjects.length / 2))
              .map((project, index) => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  isFirstInColumn={index === 0}
                />
              ))}
          </div>
          <div className="w-full bg-[hsl(var(--background))]">
            {orderedProjects
              .slice(Math.ceil(orderedProjects.length / 2))
              .map((project, index) => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  isFirstInColumn={index === 0}
                />
              ))}
          </div>
        </div>

        {/* Three column layout */}
        <div className="hidden xl:flex 3xl:hidden gap-[1px]">
          {[0, 1, 2].map((colIndex) => (
            <div key={colIndex} className="w-full bg-[hsl(var(--background))]">
              {orderedProjects
                .slice(
                  Math.ceil((colIndex * orderedProjects.length) / 3),
                  Math.ceil(((colIndex + 1) * orderedProjects.length) / 3)
                )
                .map((project, index) => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    isFirstInColumn={index === 0}
                  />
                ))}
            </div>
          ))}
        </div>

        {/* Four column layout */}
        <div className="hidden 3xl:flex 4xl:hidden gap-[1px]">
          {[0, 1, 2, 3].map((colIndex) => (
            <div key={colIndex} className="w-full bg-[hsl(var(--background))]">
              {orderedProjects
                .slice(
                  Math.ceil((colIndex * orderedProjects.length) / 4),
                  Math.ceil(((colIndex + 1) * orderedProjects.length) / 4)
                )
                .map((project, index) => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    isFirstInColumn={index === 0}
                  />
                ))}
            </div>
          ))}
        </div>

        {/* Five column layout */}
        <div className="hidden 4xl:flex gap-[1px]">
          {[0, 1, 2, 3, 4].map((colIndex) => (
            <div key={colIndex} className="w-full bg-[hsl(var(--background))]">
              {orderedProjects
                .slice(
                  Math.ceil((colIndex * orderedProjects.length) / 5),
                  Math.ceil(((colIndex + 1) * orderedProjects.length) / 5)
                )
                .map((project, index) => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    isFirstInColumn={index === 0}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 