"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"
import { useEffect, useState, ButtonHTMLAttributes } from "react"

/**
 * Props for the ThemeToggle component
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ThemeToggleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({}: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render the toggle on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer w-10 h-10"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
      className="cursor-pointer w-10 h-10 relative"
    >
      {currentTheme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 