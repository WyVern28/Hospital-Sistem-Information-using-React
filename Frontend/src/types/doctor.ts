/** A doctor and their public practice schedule. */
export interface Doctor {
  id: number
  licenseNumber: string
  experienceYears: number
  bio: string | null
  user: { name: string }
  specialty: { id: number; name: string; description: string | null }
  schedules: DoctorSchedule[]
}

export interface DoctorSchedule {
  id: number
  code: string
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string
  endTime: string
  quota: number
}
