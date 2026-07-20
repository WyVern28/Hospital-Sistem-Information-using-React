/** Fields collected while a patient registers for a visit. */
export interface AppointmentForm {
  scheduleId: number | ''
  visitDate: string
  complaint: string
}

export type AppointmentStatus = 'WAITING' | 'IN_EXAMINATION' | 'COMPLETED' | 'CANCELLED'

export interface Appointment {
  id: number
  visitDate: string
  queueNumber: number
  queueCode: string
  complaint: string
  status: AppointmentStatus
  patient: { id: number; medicalRecordNumber: string; user: { name: string } }
  doctor: { id: number; user: { name: string }; specialty: { name: string } }
  schedule: { id: number; code: string; day: string; startTime: string; endTime: string }
  medicalRecord: MedicalRecord | null
}

export interface MedicalRecord {
  id: number
  subjective: string
  objective: string
  assessment: string
  plan: string
  diagnosis: string
  treatment: string | null
  notes: string | null
  prescription: {
    id: number
    notes: string | null
    items: Array<{ id: number; medicineName: string; quantity: number; dosage: string; instruction: string | null }>
  } | null
}
