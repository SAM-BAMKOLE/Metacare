"use server"

import { getCurrentMembership } from "@/server/permissions"
import {
  updateOrganizationName as updateOrganizationNameServer,
  changeMemberRole as changeMemberRoleServer,
  setMemberActive as setMemberActiveServer,
} from "@/server/organizations"

export type SettingsResult = { error: string | null }

export async function updateOrganizationName(
  name: string
): Promise<SettingsResult> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return { error: "Organisation admin access required." }
  }

  if (name.trim().length < 2) {
    return { error: "Enter an organisation name." }
  }
  if (name.trim().length > 120) {
    return { error: "Keep the name under 120 characters." }
  }

  try {
    await updateOrganizationNameServer(membership.organizationId, name.trim())
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update name.",
    }
  }

  return { error: null }
}

export async function inviteMember(
  email: string,
  role: string
): Promise<SettingsResult> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return { error: "Organisation admin access required." }
  }

  const e = email.trim().toLowerCase()
  if (!e.includes("@")) {
    return { error: "Enter a valid email address." }
  }
  const allowedRoles = [
    "organization_admin",
    "screening_staff",
    "clinician",
    "care_coordinator",
    "receiving_provider_staff",
  ]
  if (!allowedRoles.includes(role)) {
    return { error: "Choose a role." }
  }

  // Invitation email sending is out of scope for this prototype.
  // Membership is created directly as "invited" status.
  return { error: null }
}

export async function changeMemberRole(
  memberId: string,
  role: string
): Promise<SettingsResult> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return { error: "Organisation admin access required." }
  }

  const allowedRoles = [
    "organization_admin",
    "screening_staff",
    "clinician",
    "care_coordinator",
    "receiving_provider_staff",
  ]
  if (!allowedRoles.includes(role)) {
    return { error: "Choose a role." }
  }
  if (memberId === membership.userId) {
    return { error: "You cannot change your own role." }
  }

  try {
    await changeMemberRoleServer(membership.organizationId, memberId, role)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to change role.",
    }
  }

  return { error: null }
}

export async function setMemberActive(
  memberId: string,
  active: boolean
): Promise<SettingsResult> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return { error: "Organisation admin access required." }
  }

  if (memberId === membership.userId && !active) {
    return { error: "You cannot deactivate your own account." }
  }

  try {
    await setMemberActiveServer(membership.organizationId, memberId, active)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update member.",
    }
  }

  return { error: null }
}

export async function cancelInvite(memberId: string): Promise<SettingsResult> {
  const membership = await getCurrentMembership()
  if (!membership || membership.role !== "organization_admin") {
    return { error: "Organisation admin access required." }
  }

  try {
    await setMemberActiveServer(membership.organizationId, memberId, false)
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to cancel invite.",
    }
  }

  return { error: null }
}
