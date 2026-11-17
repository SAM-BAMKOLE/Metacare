import { Flag } from "lucide-react"

import { cn } from "@/lib/utils"

const styles: Record<string, string> = {
  Routine: "bg-secondary text-secondary-foreground ring-border",
  Urgent: "bg-amber-50 text-amber-700 ring-amber-600/20",
  High: "bg-red-50 text-destructive ring-red-600/20",
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[priority] ?? styles.Routine,
        className
      )}
    >
      <Flag className="size-3" />
      {priority}
    </span>
  )
}
