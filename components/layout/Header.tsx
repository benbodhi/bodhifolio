"use client"

import { ThemeToggle } from "@/components/theme/ThemeToggle"

/**
 * Props for the Header component
 */
interface HeaderProps {}

export function Header({}: HeaderProps) {
  return (
    <header className="bg-[hsl(var(--background))]">
      <div className="h-full px-4 py-4 flex items-center justify-end">
        <ThemeToggle />
      </div>
    </header>
  )
} 