import type { Request, Response } from "express";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { recordAudit } from "../../lib/audit.js";
import type { AuthenticatedRequest } from "../../types/http.js";
import { dayOfWeek, parseVisitDate, todayIso } from "../../utils/dates.js";
import { AppError } from "../../utils/errors.js";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.");
const idSchema = z.coerce.number().int().positive();
const createSchema = z.object({
  scheduleId: z.coerce.number().int().positive(),
  visitDate: dateString,
  complaint: z.string().trim().min(5, "Keluhan minimal 5 karakter.").max(2000),
});
const updateSchema = createSchema.partial().refine((data) => Object.keys(data).length > 0, "Tidak ada perubahan.");
const examinationSchema = z.object({
  subjective: z.string().trim().min(3).max(5000),
  objective: z.string().trim().min(3).max(5000),
  assessment: z.string().trim().min(3).max(5000),
  plan: z.string().trim().min(3).max(5000),
  diagnosis: z.string().trim().min(3).max(2000),
  treatment: z.string().trim().max(3000).optional(),
  notes: z.string().trim().max(3000).optional(),
  prescriptionNotes: z.string().trim().max(2000).optional(),
  prescriptionItems: z.array(z.object({
    medicineName: z.string().trim().min(2).max(120),
    quantity: z.coerce.number().int().positive().max(999),
    dosage: z.string().trim().min(2).max(100),
    instruction: z.string().trim().max(500).optional(),
  })).max(20).default([]),
});

const appointmentInclude = {
  doctor: {
    select: {
      id: true,
      user: { select: { name: true } },
      specialty: { select: { name: true } },
    },
  },
  patient: { select: { id: true, medicalRecordNumber: true, user: { select: { name: true } } } },
  schedule: { select: { id: true, code: true, day: true, startTime: true, endTime: true } },
  medicalRecord: {
    include: { prescription: { include: { items: true } } },
  },
} satisfies Prisma.AppointmentInclude;

async function patientFor(userId: number) {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new AppError(403, "Profil pasien belum tersedia.", "PATIENT_PROFILE_REQUIRED");
  return patient;
}

async function doctorFor(userId: number) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new AppError(403, "Profil dokter belum tersedia.", "DOCTOR_PROFILE_REQUIRED");
  return doctor;
}

async function validateSchedule(scheduleId: number, visitDateValue: string) {
  const visitDate = parseVisitDate(visitDateValue);
  if (!visitDate) throw new AppError(422, "Tanggal kunjungan tidak valid.", "INVALID_DATE");
  const todayValue = todayIso();
  if (visitDateValue < todayValue) throw new AppError(422, "Jadwal lampau tidak dapat dipilih.", "PAST_SCHEDULE");

  const bookingWindow = await prisma.systemSetting.findUnique({
    where: { key: "booking_window_days" },
    select: { value: true },
  });
  const configuredBookingWindow = Number.parseInt(bookingWindow?.value ?? "30", 10);
  const bookingWindowDays = Number.isFinite(configuredBookingWindow) && configuredBookingWindow >= 0 ? configuredBookingWindow : 30;
  const latestVisit = parseVisitDate(todayValue)!;
  latestVisit.setUTCDate(latestVisit.getUTCDate() + bookingWindowDays);
  if (visitDate > latestVisit) {
    throw new AppError(422, `Pendaftaran hanya dapat dilakukan maksimal ${bookingWindowDays} hari ke depan.`, "BOOKING_WINDOW_EXCEEDED");
  }

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, isActive: true, doctor: { user: { isActive: true, role: "DOCTOR" } } },
    include: { doctor: true },
  });
  if (!schedule) throw new AppError(404, "Jadwal dokter tidak ditemukan.", "SCHEDULE_NOT_FOUND");
  if (schedule.day !== dayOfWeek(visitDate)) {
    throw new AppError(422, "Tanggal tidak sesuai dengan hari praktik dokter.", "SCHEDULE_DAY_MISMATCH");
  }

  return { schedule, visitDate };
}

async function serializableTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const shouldRetry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!shouldRetry || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 25));
    }
  }
  throw new AppError(503, "Pendaftaran sedang sibuk. Silakan coba kembali.", "TRANSACTION_RETRY_EXHAUSTED");
}

export async function createAppointment(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).auth.userId;
  const patient = await patientFor(userId);
  const { schedule, visitDate } = await validateSchedule(input.scheduleId, input.visitDate);

  const appointment = await serializableTransaction(async (tx) => {
    const existing = await tx.appointment.findUnique({
      where: { patientId_scheduleId_visitDate: { patientId: patient.id, scheduleId: schedule.id, visitDate } },
    });
    if (existing) throw new AppError(409, "Anda sudah terdaftar pada jadwal ini.", "DUPLICATE_APPOINTMENT");

    const activeCount = await tx.appointment.count({
      where: { scheduleId: schedule.id, visitDate, status: { not: "CANCELLED" } },
    });
    if (activeCount >= schedule.quota) throw new AppError(409, "Kuota jadwal ini sudah penuh.", "SCHEDULE_FULL");

    const lastQueue = await tx.appointment.aggregate({
      where: { scheduleId: schedule.id, visitDate },
      _max: { queueNumber: true },
    });
    const queueNumber = (lastQueue._max.queueNumber ?? 0) + 1;

    return tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: schedule.doctorId,
        scheduleId: schedule.id,
        visitDate,
        queueNumber,
        queueCode: `${schedule.code}-${String(queueNumber).padStart(3, "0")}`,
        complaint: input.complaint,
      },
      include: appointmentInclude,
    });
  });

  await recordAudit({ userId, action: "CREATE", entity: "APPOINTMENT", entityId: appointment.id, description: `Kunjungan ${appointment.queueCode} dibuat.` });

  res.status(201).json({ appointment });
}

export async function myAppointments(req: Request, res: Response) {
  const patient = await patientFor((req as AuthenticatedRequest).auth.userId);
  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: appointmentInclude,
    orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
  });
  res.json({ appointments });
}

export async function updateAppointment(req: Request, res: Response) {
  const appointmentId = idSchema.parse(req.params.id);
  const input = updateSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).auth.userId;
  const patient = await patientFor(userId);
  const current = await prisma.appointment.findFirst({ where: { id: appointmentId, patientId: patient.id } });

  if (!current) throw new AppError(404, "Pendaftaran tidak ditemukan.", "APPOINTMENT_NOT_FOUND");
  if (current.status !== "WAITING") throw new AppError(409, "Hanya pendaftaran berstatus menunggu yang dapat diubah.", "INVALID_STATUS");

  const nextScheduleId = input.scheduleId ?? current.scheduleId;
  const nextDateValue = input.visitDate ?? current.visitDate.toISOString().slice(0, 10);
  const { schedule, visitDate } = await validateSchedule(nextScheduleId, nextDateValue);

  let queueNumber = current.queueNumber;
  let queueCode = current.queueCode;
  if (nextScheduleId !== current.scheduleId || visitDate.getTime() !== current.visitDate.getTime()) {
    const activeCount = await prisma.appointment.count({
      where: { scheduleId: nextScheduleId, visitDate, status: { not: "CANCELLED" }, id: { not: current.id } },
    });
    if (activeCount >= schedule.quota) throw new AppError(409, "Kuota jadwal ini sudah penuh.", "SCHEDULE_FULL");
    const lastQueue = await prisma.appointment.aggregate({
      where: { scheduleId: nextScheduleId, visitDate },
      _max: { queueNumber: true },
    });
    queueNumber = (lastQueue._max.queueNumber ?? 0) + 1;
    queueCode = `${schedule.code}-${String(queueNumber).padStart(3, "0")}`;
  }

  const appointment = await prisma.appointment.update({
    where: { id: current.id },
    data: {
      scheduleId: schedule.id,
      doctorId: schedule.doctorId,
      visitDate,
      queueNumber,
      queueCode,
      complaint: input.complaint ?? current.complaint,
    },
    include: appointmentInclude,
  });
  await recordAudit({ userId, action: "UPDATE", entity: "APPOINTMENT", entityId: appointment.id, description: `Pendaftaran ${appointment.queueCode} diperbarui.` });
  res.json({ appointment });
}

export async function cancelAppointment(req: Request, res: Response) {
  const appointmentId = idSchema.parse(req.params.id);
  const userId = (req as AuthenticatedRequest).auth.userId;
  const patient = await patientFor(userId);
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, patientId: patient.id, status: "WAITING" },
    data: { status: "CANCELLED" },
  });
  if (!result.count) throw new AppError(409, "Pendaftaran tidak ditemukan atau tidak dapat dibatalkan.", "INVALID_STATUS");
  await recordAudit({ userId, action: "CANCEL", entity: "APPOINTMENT", entityId: appointmentId, description: `Pendaftaran kunjungan ${appointmentId} dibatalkan.` });
  res.status(204).send();
}

export async function publicQueue(req: Request, res: Response) {
  const queueCode = z.string().trim().min(3).max(24).parse(req.params.queueCode).toUpperCase();
  const appointment = await prisma.appointment.findFirst({
    where: { queueCode },
    include: { doctor: { include: { specialty: true, user: true } }, schedule: true },
    orderBy: { visitDate: "desc" },
  });
  if (!appointment) throw new AppError(404, "Nomor antrean tidak ditemukan.", "QUEUE_NOT_FOUND");

  const patientsAhead = appointment.status === "WAITING" ? await prisma.appointment.count({
    where: {
      scheduleId: appointment.scheduleId,
      visitDate: appointment.visitDate,
      queueNumber: { lt: appointment.queueNumber },
      status: { in: ["WAITING", "IN_EXAMINATION"] },
    },
  }) : 0;

  res.json({
    queue: {
      queueCode: appointment.queueCode,
      status: appointment.status,
      visitDate: appointment.visitDate,
      clinic: appointment.doctor.specialty.name,
      doctor: appointment.doctor.user.name,
      startTime: appointment.schedule.startTime,
      patientsAhead,
    },
  });
}

export async function doctorAppointments(req: Request, res: Response) {
  const doctor = await doctorFor((req as AuthenticatedRequest).auth.userId);
  const date = typeof req.query.date === "string" ? parseVisitDate(req.query.date) : null;
  const status = typeof req.query.status === "string" && Object.values(AppointmentStatus).includes(req.query.status as AppointmentStatus)
    ? req.query.status as AppointmentStatus
    : undefined;
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, ...(date ? { visitDate: date } : {}), ...(status ? { status } : {}) },
    include: appointmentInclude,
    orderBy: [{ visitDate: "asc" }, { queueNumber: "asc" }],
  });
  res.json({ appointments });
}

export async function startExamination(req: Request, res: Response) {
  const appointmentId = idSchema.parse(req.params.id);
  const userId = (req as AuthenticatedRequest).auth.userId;
  const doctor = await doctorFor(userId);
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, doctorId: doctor.id, status: "WAITING" },
    data: { status: "IN_EXAMINATION" },
  });
  if (!result.count) throw new AppError(409, "Antrean tidak ditemukan atau statusnya sudah berubah.", "INVALID_STATUS");
  const appointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId }, include: appointmentInclude });
  await recordAudit({ userId, action: "START_EXAMINATION", entity: "APPOINTMENT", entityId: appointmentId, description: `Pemeriksaan ${appointment.queueCode} dimulai.` });
  res.json({ appointment });
}

export async function completeExamination(req: Request, res: Response) {
  const appointmentId = idSchema.parse(req.params.id);
  const input = examinationSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).auth.userId;
  const doctor = await doctorFor(userId);

  const appointment = await prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findFirst({
      where: { id: appointmentId, doctorId: doctor.id },
    });
    if (!current) throw new AppError(404, "Antrean pasien tidak ditemukan.", "APPOINTMENT_NOT_FOUND");
    if (current.status !== "IN_EXAMINATION") {
      throw new AppError(409, "Pemeriksaan harus dimulai sebelum diselesaikan.", "INVALID_STATUS");
    }

    await tx.medicalRecord.create({
      data: {
        appointmentId: current.id,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        diagnosis: input.diagnosis,
        treatment: input.treatment || null,
        notes: input.notes || null,
        ...(input.prescriptionItems.length ? {
          prescription: {
            create: {
              notes: input.prescriptionNotes || null,
              items: {
                create: input.prescriptionItems.map((item) => ({
                  medicineName: item.medicineName,
                  quantity: item.quantity,
                  dosage: item.dosage,
                  instruction: item.instruction || null,
                })),
              },
            },
          },
        } : {}),
      },
    });

    return tx.appointment.update({
      where: { id: current.id },
      data: { status: "COMPLETED" },
      include: appointmentInclude,
    });
  });

  await recordAudit({ userId, action: "COMPLETE_EXAMINATION", entity: "APPOINTMENT", entityId: appointmentId, description: `Pemeriksaan ${appointment.queueCode} diselesaikan.` });

  res.json({ appointment });
}
