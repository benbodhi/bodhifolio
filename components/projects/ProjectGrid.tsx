"use client"

import { useEffect, useState, useCallback } from "react"
import { ProjectCard } from "./ProjectCard"
import { Project } from "@/lib/projects/types"
import { ShuffleButton } from "@/components/ui/ShuffleButton"

interface ProjectGridProps {
  initialProjects: Project[]
}

export function ProjectGrid({ initialProjects = [] }: ProjectGridProps) {
  // Ensure we have a valid array
  const projects = Array.isArray(initialProjects) ? initialProjects : []
  
  // Start with sequential order for SSR
  const [order, setOrder] = useState(() => 
    Array.from({ length: projects.length }, (_, i) => i)
  )

  // Randomize on client-side only
  useEffect(() => {
    setOrder(prev => [...prev].sort(() => Math.random() - 0.5))
  }, [])

  const handleShuffle = useCallback(() => {
    setOrder(prev => [...prev].sort(() => Math.random() - 0.5))
  }, [])

  // Map order to projects
  const orderedProjects = order.map(i => projects[i])

  return (
    <section className="w-full">
      <div className="container mx-auto px-4 mb-12">
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
        <div className="hidden xl:flex 2xl:hidden gap-[1px]">
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
        <div className="hidden 2xl:flex 3xl:hidden gap-[1px]">
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
        <div className="hidden 3xl:flex gap-[1px]">
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