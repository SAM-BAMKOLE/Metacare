import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  BarChart3,
  CheckCircle2,
  ClipboardPlus,
  Eye,
  FileCheck2,
  MessageSquareText,
  Send,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { cn } from "@/lib/utils"

const values: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Eye,
    title: "Visible next steps",
    text: "Every actionable result carries a recorded next step, so nothing depends on someone remembering.",
  },
  {
    icon: UserCheck,
    title: "Clear ownership",
    text: "Each case has a named owner, a destination and a due date. No more guessing who is responsible.",
  },
  {
    icon: Send,
    title: "No lost referrals",
    text: "Track every handoff between facilities until the receiving provider acknowledges it.",
  },
  {
    icon: BellRing,
    title: "Overdue-case alerts",
    text: "Stalled, unacknowledged and overdue cases surface in work queues and notify the right person.",
  },
  {
    icon: FileCheck2,
    title: "Documented closure",
    text: "A referral is only complete when an outcome or exception is recorded, not when it is sent.",
  },
  {
    icon: BarChart3,
    title: "Organisational insight",
    text: "See acknowledgement rates, open referrals and bottlenecks with clearly defined metrics.",
  },
]

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardPlus,
    title: "Screening recorded",
    text: "Staff record the screening event and result for a patient.",
  },
  {
    icon: Stethoscope,
    title: "Clinical review",
    text: "A clinician reviews it and documents whether follow-up is needed.",
  },
  {
    icon: UserCheck,
    title: "Case and owner",
    text: "A referral is created with an owner, destination, priority and due date.",
  },
  {
    icon: MessageSquareText,
    title: "Patient informed",
    text: "The patient is contacted and every attempt is recorded.",
  },
  {
    icon: Send,
    title: "Referral acknowledged",
    text: "The receiving facility confirms receipt and updates progress.",
  },
  {
    icon: CheckCircle2,
    title: "Outcome documented",
    text: "The case closes only with a recorded outcome or exception.",
  },
]

const gaps = [
  "Referrals lost between facilities",
  "No clear owner for the next action",
  "Patients unsure what to do next",
  "Records split across paper and chat apps",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#value" className="hover:text-foreground">
              Why Metacare
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "ghost" })}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants(), "hidden sm:inline-flex")}
            >
              Try demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-130 bg-linear-to-b from-primary/[0.07] to-transparent"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Closing the screening-to-care loop
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              From screening result to documented care.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Metacare keeps every next step visible, assigned and accountable,
              so that an actionable screening result never ends in a lost
              referral.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
                Sign in
                <ArrowRight />
              </Link>
              <Link
                href="/sign-up"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Try demo
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Demo uses fictional patient data only.
            </p>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Adaeze Okonkwo</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    MC-00124
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-destructive ring-1 ring-red-600/20 ring-inset">
                  Overdue
                </span>
              </div>
              <ol className="relative mt-5 space-y-4">
                <span
                  className="absolute top-2 bottom-2 left-3.5 w-px bg-border"
                  aria-hidden
                />
                {[
                  {
                    t: "Screening recorded",
                    s: "Funke Adebayo · 9 Nov",
                    done: true,
                  },
                  {
                    t: "Clinician confirmed follow-up",
                    s: "Dr. Emeka Obi · 10 Nov",
                    done: true,
                  },
                  {
                    t: "Patient informed",
                    s: "Ngozi Eze · 11 Nov",
                    done: true,
                  },
                  {
                    t: "Awaiting acknowledgement",
                    s: "UCH Ibadan · due 14 Nov",
                    done: false,
                  },
                ].map((e) => (
                  <li key={e.t} className="relative flex items-start gap-3">
                    <span
                      className={cn(
                        "relative z-10 flex size-7 items-center justify-center rounded-full ring-4 ring-card",
                        e.done
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      <CheckCircle2 className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{e.t}</p>
                      <p className="text-xs text-muted-foreground">{e.s}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden rounded-xl border bg-card px-4 py-3 shadow-lg sm:block">
              <p className="text-xs text-muted-foreground">
                Acknowledgement rate
              </p>
              <p className="text-xl font-semibold">86%</p>
              <p className="text-[10px] text-muted-foreground">
                Simulated data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A result is only the beginning.
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Screening programmes find people who may need further assessment.
              But between the result and the appointment, there are handoffs,
              and every handoff is a chance for care to be delayed or lost.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gaps.map((g) => (
              <li
                key={g}
                className="rounded-lg border bg-card px-4 py-3 text-sm shadow-xs"
              >
                {g}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Value */}
      <section
        id="value"
        className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Every next step, visible and accountable
          </h2>
          <p className="mt-3 text-muted-foreground">
            One traceable workflow connecting screening, review, referral and
            closure.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              The screening-to-care journey in six steps.
            </p>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="relative rounded-xl border bg-card p-6 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold text-muted-foreground/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No actionable result left without a next step.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Explore the full journey with fictional patients and two simulated
            organisations.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-in"
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              )}
            >
              Try demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between">
            <Logo />
            <p className="text-xs text-muted-foreground">Hackathon prototype</p>
          </div>
          <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium text-foreground">
                Clinical safety note:
              </span>{" "}
              Metacare is not a diagnostic system. It does not interpret results
              or recommend treatment. Clinical decisions remain with qualified
              professionals. All patient data shown is fictional and for
              demonstration only; this prototype is not evidence of regulatory
              compliance and is not ready for real patient records.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
