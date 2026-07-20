import { AppointmentStatus, DayOfWeek, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { recordAudit } from "../../lib/audit.js";
import { hashPassword } from "../../utils/password.js";
import { AppError } from "../../utils/errors.js";
import { parseVisitDate, todayIso } from "../../utils/dates.js";

export const appointmentSelect = {
  id: true,
  queueCode: true,
  status: true,
  visitDate: true,
  complaint: true,
  createdAt: true,
  patient: {
    select: {
      medicalRecordNumber: true,
      user: { select: { name: true } },
    },
  },
  doctor: {
    select: {
      user: { select: { name: true } },
      specialty: { select: { name: true } },
    },
  },
  schedule: { select: { startTime: true, endTime: true } },
} as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  patient: { select: { medicalRecordNumber: true } },
  doctor: { select: { id: true, specialty: { select: { name: true } } } },
} as const;

const doctorSelect = {
  id: true,
  licenseNumber: true,
  experienceYears: true,
  bio: true,
  user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
  specialty: { select: { id: true, name: true } },
  schedules: {
    select: { id: true, code: true, day: true, startTime: true, endTime: true, quota: true, isActive: true },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  },
} satisfies Prisma.DoctorSelect;

type AuditContext = { adminId: number; ipAddress?: string | null };

export async function getDashboard() {
  const todayValue = todayIso();
  const today = parseVisitDate(todayValue);
  if (!today) throw new AppError(500, "Tanggal sistem tidak dapat diproses.", "INVALID_SYSTEM_DATE");

  const trendStart = new Date(today);
  trendStart.setUTCDate(trendStart.getUTCDate() - 6);

  const [patients, doctors, activeUsers, appointmentsToday, waiting, statusRows, trendRows, recentAppointments] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count({ where: { user: { isActive: true, role: UserRole.DOCTOR } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.appointment.count({ where: { visitDate: today, status: { not: AppointmentStatus.CANCELLED } } }),
    prisma.appointment.count({ where: { visitDate: today, status: AppointmentStatus.WAITING } }),
    prisma.appointment.groupBy({ by: ["status"], where: { visitDate: today }, _count: { _all: true } }),
    prisma.appointment.findMany({
      where: { visitDate: { gte: trendStart, lte: today }, status: { not: AppointmentStatus.CANCELLED } },
      select: { visitDate: true },
    }),
    prisma.appointment.findMany({
      where: { visitDate: today },
      select: appointmentSelect,
      orderBy: [{ schedule: { startTime: "asc" } }, { queueNumber: "asc" }],
      take: 8,
    }),
  ]);

  const countsByDate = new Map<string, number>();
  for (const row of trendRows) {
    const key = row.visitDate.toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: countsByDate.get(key) ?? 0 };
  });

  return {
    generatedAt: new Date().toISOString(),
    metrics: { patients, doctors, activeUsers, appointmentsToday, waiting },
    statusBreakdown: Object.values(AppointmentStatus).map((status) => ({
      status,
      count: statusRows.find((row) => row.status === status)?._count._all ?? 0,
    })),
    trend,
    recentAppointments,
  };
}

export function getAppointments(query: string, status?: AppointmentStatus) {
  return prisma.appointment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(query ? {
        OR: [
          { queueCode: { contains: query } },
          { patient: { user: { name: { contains: query } } } },
          { doctor: { user: { name: { contains: query } } } },
          { doctor: { specialty: { name: { contains: query } } } },
        ],
      } : {}),
    },
    select: appointmentSelect,
    orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function setAppointmentStatus(appointmentId: number, status: AppointmentStatus, audit: AuditContext) {
  const current = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, queueCode: true, status: true, medicalRecord: { select: { id: true } } },
  });
  if (!current) throw new AppError(404, "Kunjungan tidak ditemukan.", "APPOINTMENT_NOT_FOUND");

  const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    WAITING: [AppointmentStatus.WAITING, AppointmentStatus.IN_EXAMINATION, AppointmentStatus.CANCELLED],
    IN_EXAMINATION: [AppointmentStatus.IN_EXAMINATION, AppointmentStatus.CANCELLED],
    COMPLETED: [AppointmentStatus.COMPLETED],
    CANCELLED: [AppointmentStatus.CANCELLED, AppointmentStatus.WAITING],
  };
  if (!allowedTransitions[current.status].includes(status)) {
    throw new AppError(409, "Perubahan status kunjungan tidak valid. Pemeriksaan hanya dapat diselesaikan melalui portal dokter.", "INVALID_STATUS_TRANSITION");
  }
  if (status === AppointmentStatus.COMPLETED && !current.medicalRecord) {
    throw new AppError(409, "Kunjungan belum memiliki rekam medis dan tidak dapat ditandai selesai.", "MEDICAL_RECORD_REQUIRED");
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    select: appointmentSelect,
  });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "UPDATE_STATUS", entity: "APPOINTMENT", entityId: appointmentId, description: `Status ${current.queueCode} diubah menjadi ${status}.` });
  return appointment;
}

export function getUsers(query: string, role?: UserRole) {
  return prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : {}),
    },
    select: userSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 100,
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  nik?: string;
  specialtyId?: number;
  licenseNumber?: string;
  experienceYears?: number;
  bio?: string;
}, audit: AuditContext) {
  if (input.role === UserRole.DOCTOR && (!input.specialtyId || !input.licenseNumber)) {
    throw new AppError(422, "Spesialisasi dan nomor SIP wajib untuk akun dokter.", "DOCTOR_PROFILE_REQUIRED");
  }
  if (input.role === UserRole.DOCTOR) {
    const specialty = await prisma.specialty.findUnique({ where: { id: input.specialtyId! }, select: { id: true } });
    if (!specialty) throw new AppError(404, "Spesialisasi dokter tidak ditemukan.", "SPECIALTY_NOT_FOUND");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        passwordHash,
        role: input.role,
      },
    });

    if (input.role === UserRole.PATIENT) {
      await tx.patient.create({
        data: {
          userId: created.id,
          nik: input.nik || null,
          medicalRecordNumber: `RM-${String(created.id).padStart(8, "0")}`,
        },
      });
    }

    if (input.role === UserRole.DOCTOR) {
      await tx.doctor.create({
        data: {
          userId: created.id,
          specialtyId: input.specialtyId!,
          licenseNumber: input.licenseNumber!,
          experienceYears: input.experienceYears ?? 0,
          bio: input.bio || null,
        },
      });
    }

    return tx.user.findUniqueOrThrow({ where: { id: created.id }, select: userSelect });
  });

  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "CREATE", entity: "USER", entityId: user.id, description: `Akun ${user.name} dibuat dengan role ${user.role}.` });
  return user;
}

export async function setUserStatus(userId: number, isActive: boolean, audit: AuditContext) {
  if (userId === audit.adminId && !isActive) {
    throw new AppError(409, "Akun admin yang sedang digunakan tidak dapat dinonaktifkan.", "SELF_DEACTIVATION");
  }
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!current) throw new AppError(404, "Pengguna tidak ditemukan.", "USER_NOT_FOUND");

  const user = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: { id: true, isActive: true } });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: isActive ? "ACTIVATE" : "DEACTIVATE", entity: "USER", entityId: userId, description: `Akun ${current.name} ${isActive ? "diaktifkan" : "dinonaktifkan"}.` });
  return user;
}

export async function setUserRole(userId: number, role: UserRole, audit: AuditContext) {
  if (userId === audit.adminId) throw new AppError(409, "Role akun admin yang sedang digunakan tidak dapat diubah.", "SELF_ROLE_CHANGE");
  const current = await prisma.user.findUnique({ where: { id: userId }, include: { patient: true, doctor: true } });
  if (!current) throw new AppError(404, "Pengguna tidak ditemukan.", "USER_NOT_FOUND");
  if (role === UserRole.DOCTOR && !current.doctor) {
    throw new AppError(409, "Buat profil dokter melalui menu Dokter & Jadwal sebelum menetapkan role dokter.", "DOCTOR_PROFILE_REQUIRED");
  }

  const user = await prisma.$transaction(async (tx) => {
    if (role === UserRole.PATIENT && !current.patient) {
      await tx.patient.create({ data: { userId, medicalRecordNumber: `RM-${String(userId).padStart(8, "0")}` } });
    }
    return tx.user.update({ where: { id: userId }, data: { role }, select: userSelect });
  });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "UPDATE_ROLE", entity: "USER", entityId: userId, description: `Role ${current.name} diubah dari ${current.role} menjadi ${role}.` });
  return user;
}

export function getSpecialties() {
  return prisma.specialty.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: "asc" } });
}

export function getDoctors(query: string) {
  return prisma.doctor.findMany({
    where: query ? { OR: [{ user: { name: { contains: query } } }, { specialty: { name: { contains: query } } }] } : undefined,
    select: doctorSelect,
    orderBy: { user: { name: "asc" } },
  });
}

export async function updateDoctor(doctorId: number, input: {
  name?: string;
  specialtyId?: number;
  licenseNumber?: string;
  experienceYears?: number;
  bio?: string;
  isActive?: boolean;
}, audit: AuditContext) {
  const current = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true, user: { select: { name: true } } } });
  if (!current) throw new AppError(404, "Dokter tidak ditemukan.", "DOCTOR_NOT_FOUND");
  if (input.specialtyId) {
    const specialty = await prisma.specialty.findUnique({ where: { id: input.specialtyId }, select: { id: true } });
    if (!specialty) throw new AppError(404, "Spesialisasi dokter tidak ditemukan.", "SPECIALTY_NOT_FOUND");
  }
  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      specialty: input.specialtyId ? { connect: { id: input.specialtyId } } : undefined,
      licenseNumber: input.licenseNumber,
      experienceYears: input.experienceYears,
      bio: input.bio,
      user: { update: { name: input.name, isActive: input.isActive } },
    },
    select: doctorSelect,
  });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "UPDATE", entity: "DOCTOR", entityId: doctorId, description: `Profil ${current.user.name} diperbarui.` });
  return doctor;
}

function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export async function createSchedule(doctorId: number, input: { code: string; day: DayOfWeek; startTime: string; endTime: string; quota: number }, audit: AuditContext) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true, user: { select: { name: true } } } });
  if (!doctor) throw new AppError(404, "Dokter tidak ditemukan.", "DOCTOR_NOT_FOUND");
  const schedule = await prisma.doctorSchedule.create({
    data: { doctorId, code: input.code.toUpperCase(), day: input.day, startTime: time(input.startTime), endTime: time(input.endTime), quota: input.quota },
    select: { id: true, code: true, day: true, startTime: true, endTime: true, quota: true, isActive: true },
  });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "CREATE", entity: "SCHEDULE", entityId: schedule.id, description: `Jadwal ${schedule.code} untuk ${doctor.user.name} dibuat.` });
  return schedule;
}

export async function updateSchedule(scheduleId: number, input: { code?: string; day?: DayOfWeek; startTime?: string; endTime?: string; quota?: number; isActive?: boolean }, audit: AuditContext) {
  const current = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
    select: { id: true, code: true, startTime: true, endTime: true },
  });
  if (!current) throw new AppError(404, "Jadwal tidak ditemukan.", "SCHEDULE_NOT_FOUND");
  const nextStartTime = input.startTime ?? current.startTime.toISOString().slice(11, 16);
  const nextEndTime = input.endTime ?? current.endTime.toISOString().slice(11, 16);
  if (nextStartTime >= nextEndTime) {
    throw new AppError(422, "Jam selesai harus setelah jam mulai.", "INVALID_SCHEDULE_TIME");
  }
  const schedule = await prisma.doctorSchedule.update({
    where: { id: scheduleId },
    data: {
      code: input.code?.toUpperCase(),
      day: input.day,
      startTime: input.startTime ? time(input.startTime) : undefined,
      endTime: input.endTime ? time(input.endTime) : undefined,
      quota: input.quota,
      isActive: input.isActive,
    },
    select: { id: true, code: true, day: true, startTime: true, endTime: true, quota: true, isActive: true },
  });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "UPDATE", entity: "SCHEDULE", entityId: scheduleId, description: `Jadwal ${current.code} diperbarui.` });
  return schedule;
}

export function getSettings() {
  return prisma.systemSetting.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] });
}

export async function updateSetting(key: string, value: string, audit: AuditContext) {
  const current = await prisma.systemSetting.findUnique({ where: { key } });
  if (!current) throw new AppError(404, "Konfigurasi tidak ditemukan.", "SETTING_NOT_FOUND");
  if (current.valueType === "NUMBER" && (!/^\d+$/.test(value) || Number(value) < 0)) {
    throw new AppError(422, `${current.label} harus berupa angka nol atau lebih.`, "INVALID_SETTING_VALUE");
  }
  if (current.valueType === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new AppError(422, `${current.label} harus berupa alamat email yang valid.`, "INVALID_SETTING_VALUE");
  }
  const setting = await prisma.systemSetting.update({ where: { key }, data: { value } });
  await recordAudit({ userId: audit.adminId, ipAddress: audit.ipAddress, action: "UPDATE", entity: "SETTING", entityId: key, description: `Konfigurasi ${current.label} diperbarui.` });
  return setting;
}

export function getAuditLogs(query: string, action?: string) {
  return prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(query ? { OR: [{ description: { contains: query } }, { entity: { contains: query } }, { user: { name: { contains: query } } }] } : {}),
    },
    select: { id: true, action: true, entity: true, entityId: true, description: true, ipAddress: true, createdAt: true, user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getReport(dateFrom: Date, dateTo: Date) {
  const rangeDays = Math.floor((dateTo.getTime() - dateFrom.getTime()) / 86_400_000) + 1;
  if (rangeDays < 1 || rangeDays > 366) throw new AppError(422, "Rentang laporan maksimal 366 hari.", "INVALID_REPORT_RANGE");

  const [appointments, newPatients, totalPatients, doctors] = await Promise.all([
    prisma.appointment.findMany({ where: { visitDate: { gte: dateFrom, lte: dateTo } }, select: { visitDate: true, status: true } }),
    prisma.patient.count({ where: { createdAt: { gte: dateFrom, lt: new Date(dateTo.getTime() + 86_400_000) } } }),
    prisma.patient.count(),
    prisma.doctor.findMany({
      where: { user: { role: UserRole.DOCTOR } },
      select: {
        id: true,
        user: { select: { name: true } },
        specialty: { select: { name: true } },
        appointments: { where: { visitDate: { gte: dateFrom, lte: dateTo } }, select: { status: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    const key = appointment.visitDate.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const visits = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(dateFrom);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });

  const statusBreakdown = Object.values(AppointmentStatus).map((status) => ({ status, count: appointments.filter((item) => item.status === status).length }));
  const doctorPerformance = doctors.map((doctor) => {
    const total = doctor.appointments.length;
    const completed = doctor.appointments.filter((item) => item.status === AppointmentStatus.COMPLETED).length;
    const cancelled = doctor.appointments.filter((item) => item.status === AppointmentStatus.CANCELLED).length;
    return { id: doctor.id, name: doctor.user.name, specialty: doctor.specialty.name, total, completed, cancelled, completionRate: total ? Math.round((completed / total) * 100) : 0 };
  });

  return {
    generatedAt: new Date().toISOString(),
    period: { from: dateFrom.toISOString().slice(0, 10), to: dateTo.toISOString().slice(0, 10) },
    metrics: { totalVisits: appointments.length, completedVisits: statusBreakdown.find((item) => item.status === AppointmentStatus.COMPLETED)?.count ?? 0, newPatients, totalPatients },
    visits,
    statusBreakdown,
    doctorPerformance,
    revenue: { available: false, amount: null, note: "Laporan pendapatan aktif setelah modul kasir dan penagihan Release 3 tersedia." },
  };
}
