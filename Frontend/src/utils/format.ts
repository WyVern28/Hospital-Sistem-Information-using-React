import type { AppointmentStatus } from '../types'

export const dayLabels: Record<string, string> = {
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
}

export const statusLabels: Record<AppointmentStatus, string> = {
  WAITING: 'Menunggu',
  IN_EXAMINATION: 'Sedang diperiksa',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export function formatTime(value: string) {
  const match = value.match(/T(\d{2}:\d{2})/)
  return match?.[1] ?? value.slice(0, 5)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function todayInJakarta() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
}
