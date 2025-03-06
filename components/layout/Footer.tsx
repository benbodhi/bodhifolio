import { Noggles } from "@/components/icons/Noggles"
// Removing unused import
// import { RollingBomb } from "@/components/icons/RollingBomb"
import React from "react";

/**
 * Props for the Footer component
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type FooterProps = React.HTMLAttributes<HTMLElement>;

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