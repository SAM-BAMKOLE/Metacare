import Link from "next/link"
import { HeartPulse } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  href = "/",
}: {
  className?: string
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulse className="size-4.5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Metacare</span>
    </Link>
  )
}
