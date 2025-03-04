"use client"

import { projects } from '@/lib/projects/data'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import Profile from '@/components/profile/Profile'

export default function Home() {
  return (
    <main>
      <Profile />
      <ProjectGrid initialProjects={projects} />
    </main>
  )
}

