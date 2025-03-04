import Link from "next/link"
import { cn } from "@/lib/utils"

interface GradientLinkProps {
  href: string
  children: React.ReactNode
  className?: string
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