import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
  FileText,
  Mail,
  MapPin,
  Phone,
  Send,
  Stethoscope,
  UserCheck,
  type LucideIcon,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  ageFromDob,
  formatDate,
  formatDateTime,
  initials,
} from "@/modules/patients/data"
import { getCurrentMembership } from "@/server/permissions"
import { getPatientDetail } from "@/server/patient-detail"

const timelineIcons: Record<string, LucideIcon> = {
  screening: ClipboardPlus,
  review: Stethoscope,
  case: FileText,
  contact: Phone,
  referral: Send,
  alert: AlertTriangle,
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membership = await getCurrentMembership()
  if (!membership) return notFound()

  const { id } = await params
  const patient = await getPatientDetail(id, membership.organizationId)
  if (!patient) notFound()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All patients
      </Link>

      <section className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials(patient.name)}
            </span>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {patient.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{patient.internalId}</span>
                <span className="mx-2">·</span>
                {patient.organization}
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/screenings/new?patientId=${patient.id}`}
            className={buttonVariants({ size: "lg" })}
          >
            <ClipboardPlus />
            New screening event
          </Link>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <CalendarDays className="size-3.5" /> Date of birth
            </dt>
            <dd className="text-sm">
              {formatDate(patient.dob)}
              <span className="text-muted-foreground">
                {" "}
                · {ageFromDob(patient.dob)} years
              </span>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Phone className="size-3.5" /> Phone
            </dt>
            <dd className="text-sm">{patient.phone}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Mail className="size-3.5" /> Email
            </dt>
            <dd className="text-sm">
              {patient.email ?? (
                <span className="text-muted-foreground">
                  Not provided
                </span>
              )}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <MapPin className="size-3.5" /> Organisation
            </dt>
            <dd className="text-sm">{patient.organization}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-muted/60 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Administrative notes
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">
            {patient.notes || (
              <span className="text-muted-foreground">
                No administrative notes.
              </span>
            )}
          </p>
        </div>
      </section>

      <Tabs defaultValue="screenings" className="gap-4">
        <TabsList className="h-10">
          <TabsTrigger value="screenings" className="px-4">
            Screening events
            <span className="ml-1.5 rounded-full bg-background px-1.5 text-xs text-muted-foreground">
              {patient.screenings.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="px-4">
            Referrals
            <span className="ml-1.5 rounded-full bg-background px-1.5 text-xs text-muted-foreground">
              {patient.referrals.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="px-4">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screenings">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            {patient.screenings.length === 0 ? (
              <EmptyState
                title="No screening events"
                text="Record a screening event to start this patient's care journey."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-11 pl-5">Screening</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Recorded by
                    </TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.screenings.map((s) => (
                    <TableRow key={s.id} className="group relative">
                      <TableCell className="py-3.5 pl-5">
                        <Link
                          href={`/dashboard/patients/${patient.id}`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          <span className="block font-medium group-hover:text-primary">
                            {s.type}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {patient.internalId}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(s.date)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {s.location}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {s.recordedBy}
                      </TableCell>
                      <TableCell className="pr-5">
                        <StatusBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            {patient.referrals.length === 0 ? (
              <EmptyState
                title="No referrals"
                text="Referrals appear here once a clinician confirms follow-up is required."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-11 pl-5">Destination</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Owner
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="py-3.5 pl-5 font-medium">
                        {r.destination}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <UserCheck className="size-3.5" />
                          {r.owner}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDate(r.created)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            r.overdue
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {r.due ? formatDate(r.due) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={r.status} />
                          {r.overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-destructive ring-1 ring-red-600/20 ring-inset">
                              <AlertTriangle className="size-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            {patient.timeline.length === 0 ? (
              <EmptyState
                title="No activity yet"
                text="Care events will appear here in chronological order."
              />
            ) : (
              <ol className="relative space-y-6">
                <span
                  className="absolute top-2 bottom-2 left-4 w-px bg-border"
                  aria-hidden
                />
                {patient.timeline.map((e) => {
                  const Icon = timelineIcons[e.type] ?? Activity
                  const isAlert = e.type === "alert"
                  return (
                    <li key={e.id} className="relative flex gap-4">
                      <span
                        className={
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card " +
                          (isAlert
                            ? "bg-red-50 text-destructive"
                            : "bg-primary/10 text-primary")
                        }
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
                        <p className="text-sm text-muted-foreground">
                          {e.actor}
                        </p>
                        {e.detail && <p className="mt-1 text-sm">{e.detail}</p>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
