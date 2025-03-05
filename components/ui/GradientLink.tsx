import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Props for the GradientLink component
 */
interface GradientLinkProps {
  /**
   * URL the link points to
   */
  href: string
  /**
   * Content to be rendered inside the link
   */
  children: React.ReactNode
  /**
   * Additional CSS classes to apply to the link
   */
  className?: string
  /**
   * Whether the link should open in a new tab
   * @default true
   */
  external?: boolean
}

export function GradientLink({ href, children, className, external = true }: GradientLinkProps) {
  const LinkComponent = external ? 'a' : Link
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {}

  return (
    <LinkComponent
      href={href}
      {...externalProps}
      className={cn("gradient-link", className)}
    >
      {children}
    </LinkComponent>
  )
} 