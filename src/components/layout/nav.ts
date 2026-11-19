import {
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  ScrollText,
  Send,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  section: "Workspace" | "Insights" | "Organisation"
  exact?: boolean
  roles?: string[] // omit = every role
}

const clinical = ["screening_staff", "clinician", "care_coordinator"]

// Admin access is separate from clinical access, so organization_admin does not
// see Patients, Screenings or Referrals. Change the `roles` arrays to adjust.
export const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "Workspace",
    exact: true,
  },
  {
    label: "Patients",
    href: "/dashboard/patients",
    icon: Users,
    section: "Workspace",
    roles: clinical,
  },
  {
    label: "Screenings",
    href: "/dashboard/screenings",
    icon: ClipboardList,
    section: "Workspace",
    roles: clinical,
  },
  {
    label: "Referrals",
    href: "/dashboard/referrals",
    icon: Send,
    section: "Workspace",
    roles: [...clinical, "receiving_provider_staff"],
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    section: "Workspace",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    section: "Insights",
    roles: ["organization_admin", "care_coordinator"],
  },
  {
    label: "Audit log",
    href: "/dashboard/audit",
    icon: ScrollText,
    section: "Organisation",
    roles: ["organization_admin"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: "Organisation",
    roles: ["organization_admin"],
  },
]

export const roleLabels: Record<string, string> = {
  organization_admin: "Organisation admin",
  screening_staff: "Screening staff",
  clinician: "Clinician",
  care_coordinator: "Care coordinator",
  receiving_provider_staff: "Receiving provider staff",
}

export function navSections(role: string | null) {
  // Unknown role: show everything except admin-only items.
  const visible = navItems.filter((i) =>
    role === null
      ? !i.roles || !i.roles.every((r) => r === "organization_admin")
      : !i.roles || i.roles.includes(role)
  )
  const order: NavItem["section"][] = ["Workspace", "Insights", "Organisation"]
  return order
    .map((title) => ({
      title,
      items: visible.filter((i) => i.section === title),
    }))
    .filter((s) => s.items.length > 0)
}
