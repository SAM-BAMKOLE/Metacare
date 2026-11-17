// Fictional demo data. Replace with Drizzle queries later.
import type { ScreeningStatus } from "@/modules/patients/data"

export type ResultCategory =
  "Within expected range" | "Outside expected range" | "Inconclusive"

export const resultCategories: ResultCategory[] = [
  "Within expected range",
  "Outside expected range",
  "Inconclusive",
]

export const screeningTypes = [
  "Blood pressure check",
  "Diabetes screening",
  "Cervical screening",
  "Breast screening",
  "Vision screening",
]

export type Screening = {
  id: string
  patientId: string
  patientName: string
  internalId: string
  type: string
  date: string
  location: string
  recordedBy: string
  resultCategory: ResultCategory
  notes: string
  requiresReview: boolean
  status: ScreeningStatus
}

export const screenings: Screening[] = [
  {
    id: "s_03",
    patientId: "p_02",
    patientName: "Ibrahim Musa",
    internalId: "MC-00125",
    type: "Blood pressure check",
    date: "2026-11-12",
    location: "Ibadan Community Clinic",
    recordedBy: "Funke Adebayo",
    resultCategory: "Outside expected range",
    notes:
      "Two readings taken five minutes apart. Patient reports no symptoms today.",
    requiresReview: true,
    status: "Awaiting review",
  },
  {
    id: "s_08",
    patientId: "p_04",
    patientName: "Oluwaseun Adeyemi",
    internalId: "MC-00127",
    type: "Blood pressure check",
    date: "2026-11-14",
    location: "Mobile outreach, Agodi",
    recordedBy: "Tunde Bello",
    resultCategory: "Inconclusive",
    notes:
      "Reading interrupted. Repeat measurement recommended by staff on site.",
    requiresReview: true,
    status: "Awaiting review",
  },
  {
    id: "s_01",
    patientId: "p_01",
    patientName: "Adaeze Okonkwo",
    internalId: "MC-00124",
    type: "Cervical screening",
    date: "2026-11-09",
    location: "Ibadan Community Clinic",
    recordedBy: "Funke Adebayo",
    resultCategory: "Outside expected range",
    notes: "Sample sent for assessment.",
    requiresReview: true,
    status: "Follow-up required",
  },
  {
    id: "s_04",
    patientId: "p_03",
    patientName: "Chiamaka Nwosu",
    internalId: "MC-00126",
    type: "Breast screening",
    date: "2026-10-28",
    location: "Ibadan Community Clinic",
    recordedBy: "Tunde Bello",
    resultCategory: "Outside expected range",
    notes: "",
    requiresReview: true,
    status: "Follow-up required",
  },
  {
    id: "s_07",
    patientId: "p_03",
    patientName: "Chiamaka Nwosu",
    internalId: "MC-00126",
    type: "Blood pressure check",
    date: "2026-11-13",
    location: "Ibadan Community Clinic",
    recordedBy: "Funke Adebayo",
    resultCategory: "Within expected range",
    notes: "",
    requiresReview: false,
    status: "Result recorded",
  },
  {
    id: "s_05",
    patientId: "p_04",
    patientName: "Oluwaseun Adeyemi",
    internalId: "MC-00127",
    type: "Diabetes screening",
    date: "2026-10-15",
    location: "Mobile outreach, Agodi",
    recordedBy: "Tunde Bello",
    resultCategory: "Within expected range",
    notes: "",
    requiresReview: true,
    status: "No follow-up needed",
  },
  {
    id: "s_02",
    patientId: "p_01",
    patientName: "Adaeze Okonkwo",
    internalId: "MC-00124",
    type: "Blood pressure check",
    date: "2025-06-21",
    location: "Mobile outreach, Bodija",
    recordedBy: "Tunde Bello",
    resultCategory: "Within expected range",
    notes: "",
    requiresReview: true,
    status: "No follow-up needed",
  },
]

export function getScreening(id: string) {
  return screenings.find((s) => s.id === id)
}
