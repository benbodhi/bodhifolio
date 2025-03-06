"use client"

import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { HTMLAttributes } from "react"

/**
 * Props for the Header component
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type HeaderProps = HTMLAttributes<HTMLElement>;

export function Header({}: HeaderProps) {
  return (
    <header className="bg-[hsl(var(--background))]">
      <div className="h-full px-4 py-4 flex items-center justify-end">
        <ThemeToggle />
      </div>
    </header>
  )
} 