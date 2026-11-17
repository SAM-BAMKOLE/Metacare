import { cn } from "@/lib/utils"

const styles: Record<string, string> = {
  "Within expected range": "bg-emerald-500",
  "Outside expected range": "bg-amber-500",
  Inconclusive: "bg-slate-400",
}

export function ResultBadge({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span
        className={cn(
          "size-2 rounded-full",
          styles[category] ?? "bg-slate-400"
        )}
      />
      {category}
    </span>
  )
}
