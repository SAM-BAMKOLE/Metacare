import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  Phone,
  Send,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDateTime } from "@/modules/patients/data"

const icons: Record<string, LucideIcon> = {
  screening: ClipboardPlus,
  review: Stethoscope,
  case: FileText,
  contact: Phone,
  referral: Send,
  alert: AlertTriangle,
  closure: CheckCircle2,
}

export type TimelineEvent = {
  id: string
  type: string
  title: string
  actor: string
  at: string
  detail?: string
}

export function CareTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Care events will appear here in chronological order.
      </p>
    )
  }

  return (
    <ol className="relative space-y-6">
      <span
        className="absolute top-2 bottom-2 left-4 w-px bg-border"
        aria-hidden
      />
      {events.map((e) => {
        const Icon = icons[e.type] ?? Activity
        return (
          <li key={e.id} className="relative flex gap-4">
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                e.type === "alert"
                  ? "bg-red-50 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-sm font-medium">{e.title}</p>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(e.at)}
                </time>
              </div>
              <p className="text-sm text-muted-foreground">{e.actor}</p>
              {e.detail && <p className="mt-1 text-sm">{e.detail}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
