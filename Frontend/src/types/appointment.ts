/** Fields collected while a patient registers for a visit. */
export interface AppointmentForm {
  name: string
  nik: string
  phone: string
  clinic: string
  doctor: string
  date: string
  complaint: string
}

export type AppointmentStatus = 'waiting' | 'cancelled'
