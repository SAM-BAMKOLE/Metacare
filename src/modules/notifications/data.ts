// Fictional demo data. Replace with Drizzle queries later.
// Notification text must never include patient names or results.

export type NotificationType =
  | "assigned"
  | "awaiting_ack"
  | "due_soon"
  | "overdue"
  | "patient_response"
  | "provider_update"
  | "escalated"
  | "referral_created"

export type Delivery = "delivered" | "failed" | "pending"
export type NotificationChannel = "in_app" | "sms"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  content: string
  channel: NotificationChannel
  delivery: Delivery
  simulated: boolean // true = recorded by the prototype, never sent externally
  read: boolean
  referralId: string
  at: string
}

export const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "overdue",
    title: "Referral REF-0001 is overdue",
    content:
      "No acknowledgement was received by the due date. Follow up with the receiving facility.",
    channel: "in_app",
    delivery: "delivered",
    simulated: false,
    read: false,
    referralId: "r_01",
    at: "2026-11-16T08:00:00Z",
  },
  {
    id: "n2",
    type: "escalated",
    title: "Referral REF-0007 was escalated",
    content:
      "Documentation from the receiving facility is overdue. Escalated to the care coordination lead.",
    channel: "in_app",
    delivery: "delivered",
    simulated: false,
    read: false,
    referralId: "r_07",
    at: "2026-11-16T07:30:00Z",
  },
  {
    id: "n3",
    type: "patient_response",
    title: "Patient replied about REF-0012",
    content:
      "A reply was received to the reminder message. Review it and record the contact.",
    channel: "sms",
    delivery: "delivered",
    simulated: true,
    read: false,
    referralId: "r_12",
    at: "2026-11-16T07:05:00Z",
  },
  {
    id: "n4",
    type: "due_soon",
    title: "REF-0012 is due tomorrow",
    content:
      "The patient has not yet been reached. Another contact attempt may be needed.",
    channel: "in_app",
    delivery: "delivered",
    simulated: false,
    read: false,
    referralId: "r_12",
    at: "2026-11-16T06:00:00Z",
  },
  {
    id: "n5",
    type: "awaiting_ack",
    title: "Reminder to patient for REF-0007 failed",
    content:
      "The reminder message could not be delivered. The task is still open in your queue.",
    channel: "sms",
    delivery: "failed",
    simulated: true,
    read: false,
    referralId: "r_07",
    at: "2026-11-15T15:20:00Z",
  },
  {
    id: "n6",
    type: "assigned",
    title: "REF-0012 was assigned to you",
    content: "Review the case, contact the patient and send the referral.",
    channel: "in_app",
    delivery: "delivered",
    simulated: false,
    read: true,
    referralId: "r_12",
    at: "2026-11-14T10:10:00Z",
  },
  {
    id: "n7",
    type: "provider_update",
    title: "REF-0002 was acknowledged",
    content:
      "The receiving facility confirmed receipt and is acting on the referral.",
    channel: "in_app",
    delivery: "delivered",
    simulated: false,
    read: true,
    referralId: "r_02",
    at: "2026-11-13T09:00:00Z",
  },
  {
    id: "n8",
    type: "awaiting_ack",
    title: "Appointment details sent for REF-0011",
    content: "A message with the next-step details is queued for the patient.",
    channel: "sms",
    delivery: "pending",
    simulated: true,
    read: true,
    referralId: "r_11",
    at: "2026-11-13T08:30:00Z",
  },
]
