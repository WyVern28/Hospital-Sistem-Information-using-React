import type { AppointmentStatus } from '../../../types/appointment'
import type { UserRole } from '../../../types/auth'
import type { DoctorSchedule } from '../../../types/doctor'

export interface AdminAppointment {
  id: number
  queueCode: string
  status: AppointmentStatus
  visitDate: string
  complaint: string
  createdAt: string
  patient: { medicalRecordNumber: string; user: { name: string } }
  doctor: { user: { name: string }; specialty: { name: string } }
  schedule: { startTime: string; endTime: string }
}

export interface AdminUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  patient: { medicalRecordNumber: string } | null
  doctor: { id: number; specialty: { name: string } } | null
}

export interface AdminSchedule extends DoctorSchedule {
  isActive: boolean
}

export interface AdminDoctor {
  id: number
  licenseNumber: string
  experienceYears: number
  bio: string | null
  user: { id: number; name: string; email: string; phone: string | null; isActive: boolean }
  specialty: { id: number; name: string }
  schedules: AdminSchedule[]
}

export interface AdminSpecialty {
  id: number
  name: string
  description: string | null
}

export interface AdminSetting {
  id: number
  key: string
  label: string
  value: string
  valueType: 'TEXT' | 'EMAIL' | 'NUMBER' | string
  group: string
  description: string | null
  updatedAt: string
}

export interface AdminAuditLog {
  id: number
  action: string
  entity: string
  entityId: string | null
  description: string
  ipAddress: string | null
  createdAt: string
  user: { id: number; name: string; role: UserRole } | null
}

export interface AdminReport {
  generatedAt: string
  period: { from: string; to: string }
  metrics: { totalVisits: number; completedVisits: number; newPatients: number; totalPatients: number }
  visits: Array<{ date: string; count: number }>
  statusBreakdown: Array<{ status: AppointmentStatus; count: number }>
  doctorPerformance: Array<{
    id: number
    name: string
    specialty: string
    total: number
    completed: number
    cancelled: number
    completionRate: number
  }>
  revenue: { available: boolean; amount: number | null; note: string }
}

export type AdminDay = AdminSchedule['day']

export interface AdminDashboardData {
  generatedAt: string
  metrics: {
    patients: number
    doctors: number
    activeUsers: number
    appointmentsToday: number
    waiting: number
  }
  statusBreakdown: Array<{ status: AppointmentStatus; count: number }>
  trend: Array<{ date: string; count: number }>
  recentAppointments: AdminAppointment[]
}
