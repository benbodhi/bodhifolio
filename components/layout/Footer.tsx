import { Noggles } from "@/components/icons/Noggles"
import { RollingBomb } from "@/components/icons/RollingBomb"

/**
 * Props for the Footer component
 */
interface FooterProps {}

export function Footer({}: FooterProps) {
  return (
    <footer className="h-[116px] bg-[hsl(var(--background))] mt-24 relative">
      <div className="container h-16 mx-auto px-4 flex items-center justify-center z-10 relative">
        <Noggles />
      </div>
      {/* <RollingBomb /> */}
    </footer>
  )
} 