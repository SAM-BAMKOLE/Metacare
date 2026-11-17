import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const styles: Record<string, string> = {
  // Screening
  "Awaiting review": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Follow-up required": "bg-primary/10 text-primary ring-primary/20",
  "No follow-up needed": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Result recorded": "bg-secondary text-secondary-foreground ring-border",
  // Referral
  "Awaiting acknowledgement": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Acknowledged: "bg-sky-50 text-sky-700 ring-sky-600/20",
  "In progress": "bg-primary/10 text-primary ring-primary/20",
  "Awaiting patient action": "bg-orange-50 text-orange-700 ring-orange-600/20",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Declined or redirected":
    "bg-secondary text-secondary-foreground ring-border",
  Draft: "bg-secondary text-secondary-foreground ring-border",
  "Pending assignment": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Ready to send": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Sent: "bg-sky-50 text-sky-700 ring-sky-600/20",
  "Awaiting follow-up documentation":
    "bg-orange-50 text-orange-700 ring-orange-600/20",
  Cancelled: "bg-secondary text-muted-foreground ring-border",
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? styles["Result recorded"],
        className
      )}
    >
      {status}
    </Badge>
  )
}
