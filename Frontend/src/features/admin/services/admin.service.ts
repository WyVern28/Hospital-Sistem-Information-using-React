import { api } from '../../../services/api'
import type { AppointmentStatus, UserRole } from '../../../types'
import type {
  AdminAppointment,
  AdminAuditLog,
  AdminDashboardData,
  AdminDoctor,
  AdminReport,
  AdminSchedule,
  AdminSetting,
  AdminSpecialty,
  AdminUser,
} from '../types/admin'

export const adminService = {
  async dashboard() {
    return (await api.get<AdminDashboardData>('/admin/dashboard')).data
  },
  async appointments() {
    return (await api.get<{ appointments: AdminAppointment[] }>('/admin/appointments')).data.appointments
  },
  async updateAppointmentStatus(id: number, status: AppointmentStatus) {
    return (await api.patch<{ appointment: AdminAppointment }>(`/admin/appointments/${id}/status`, { status })).data.appointment
  },
  async users() {
    return (await api.get<{ users: AdminUser[] }>('/admin/users')).data.users
  },
  async createUser(payload: {
    name: string
    email: string
    phone?: string
    password: string
    role: UserRole
    nik?: string
    specialtyId?: number
    licenseNumber?: string
    experienceYears?: number
    bio?: string
  }) {
    return (await api.post<{ user: AdminUser }>('/admin/users', payload)).data.user
  },
  async updateUserStatus(id: number, isActive: boolean) {
    await api.patch(`/admin/users/${id}/status`, { isActive })
  },
  async updateUserRole(id: number, role: UserRole) {
    return (await api.patch<{ user: AdminUser }>(`/admin/users/${id}/role`, { role })).data.user
  },
  async specialties() {
    return (await api.get<{ specialties: AdminSpecialty[] }>('/admin/specialties')).data.specialties
  },
  async doctors() {
    return (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).data.doctors
  },
  async updateDoctor(id: number, payload: Partial<{ name: string; specialtyId: number; licenseNumber: string; experienceYears: number; bio: string; isActive: boolean }>) {
    return (await api.patch<{ doctor: AdminDoctor }>(`/admin/doctors/${id}`, payload)).data.doctor
  },
  async createSchedule(doctorId: number, payload: { code: string; day: AdminSchedule['day']; startTime: string; endTime: string; quota: number }) {
    return (await api.post<{ schedule: AdminSchedule }>(`/admin/doctors/${doctorId}/schedules`, payload)).data.schedule
  },
  async updateSchedule(id: number, payload: Partial<{ code: string; day: AdminSchedule['day']; startTime: string; endTime: string; quota: number; isActive: boolean }>) {
    return (await api.patch<{ schedule: AdminSchedule }>(`/admin/schedules/${id}`, payload)).data.schedule
  },
  async settings() {
    return (await api.get<{ settings: AdminSetting[] }>('/admin/settings')).data.settings
  },
  async updateSetting(key: string, value: string) {
    return (await api.patch<{ setting: AdminSetting }>(`/admin/settings/${key}`, { value })).data.setting
  },
  async auditLogs() {
    return (await api.get<{ logs: AdminAuditLog[] }>('/admin/audit-logs')).data.logs
  },
  async report(from: string, to: string) {
    return (await api.get<AdminReport>('/admin/reports', { params: { from, to } })).data
  },
}
