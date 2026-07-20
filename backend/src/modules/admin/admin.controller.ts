import type { Request, Response } from "express";
import { AppointmentStatus, DayOfWeek, UserRole } from "@prisma/client";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../types/http.js";
import { parseVisitDate } from "../../utils/dates.js";
import { AppError } from "../../utils/errors.js";
import * as adminService from "./admin.service.js";

const idSchema = z.coerce.number().int().positive();
const statusSchema = z.object({ status: z.nativeEnum(AppointmentStatus) });
const userStatusSchema = z.object({ isActive: z.boolean() });
const userRoleSchema = z.object({ role: z.nativeEnum(UserRole) });
const createUserSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(191),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/).optional().or(z.literal("")),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
  nik: z.string().regex(/^[0-9]{16}$/).optional().or(z.literal("")),
  specialtyId: z.coerce.number().int().positive().optional(),
  licenseNumber: z.string().trim().min(4).max(50).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(70).optional(),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});
const doctorUpdateSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  specialtyId: z.coerce.number().int().positive().optional(),
  licenseNumber: z.string().trim().min(4).max(50).optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).optional(),
  bio: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu harus berformat HH:mm.");
const scheduleCreateSchema = z.object({
  code: z.string().trim().min(3).max(12).regex(/^[A-Za-z0-9-]+$/),
  day: z.nativeEnum(DayOfWeek),
  startTime: timeSchema,
  endTime: timeSchema,
  quota: z.coerce.number().int().min(1).max(500),
}).refine((value) => value.startTime < value.endTime, { message: "Jam selesai harus setelah jam mulai.", path: ["endTime"] });
const scheduleUpdateSchema = z.object({
  code: z.string().trim().min(3).max(12).regex(/^[A-Za-z0-9-]+$/).optional(),
  day: z.nativeEnum(DayOfWeek).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  quota: z.coerce.number().int().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.")
  .refine((value) => !value.startTime || !value.endTime || value.startTime < value.endTime, { message: "Jam selesai harus setelah jam mulai.", path: ["endTime"] });
const settingSchema = z.object({ value: z.string().trim().max(2000) });
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function auditContext(req: Request) {
  return { adminId: (req as AuthenticatedRequest).auth.userId, ipAddress: req.ip };
}

export async function dashboard(_req: Request, res: Response) {
  res.json(await adminService.getDashboard());
}

export async function listAppointments(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" && Object.values(AppointmentStatus).includes(req.query.status as AppointmentStatus)
    ? req.query.status as AppointmentStatus
    : undefined;
  res.json({ appointments: await adminService.getAppointments(query, status) });
}

export async function updateAppointmentStatus(req: Request, res: Response) {
  const appointment = await adminService.setAppointmentStatus(idSchema.parse(req.params.id), statusSchema.parse(req.body).status, auditContext(req));
  res.json({ appointment });
}

export async function listUsers(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const role = typeof req.query.role === "string" && Object.values(UserRole).includes(req.query.role as UserRole)
    ? req.query.role as UserRole
    : undefined;
  res.json({ users: await adminService.getUsers(query, role) });
}

export async function createUser(req: Request, res: Response) {
  const user = await adminService.createUser(createUserSchema.parse(req.body), auditContext(req));
  res.status(201).json({ user });
}

export async function updateUserStatus(req: Request, res: Response) {
  const user = await adminService.setUserStatus(idSchema.parse(req.params.id), userStatusSchema.parse(req.body).isActive, auditContext(req));
  res.json({ user });
}

export async function updateUserRole(req: Request, res: Response) {
  const user = await adminService.setUserRole(idSchema.parse(req.params.id), userRoleSchema.parse(req.body).role, auditContext(req));
  res.json({ user });
}

export async function listSpecialties(_req: Request, res: Response) {
  res.json({ specialties: await adminService.getSpecialties() });
}

export async function listDoctors(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  res.json({ doctors: await adminService.getDoctors(query) });
}

export async function updateDoctor(req: Request, res: Response) {
  const doctor = await adminService.updateDoctor(idSchema.parse(req.params.id), doctorUpdateSchema.parse(req.body), auditContext(req));
  res.json({ doctor });
}

export async function createSchedule(req: Request, res: Response) {
  const schedule = await adminService.createSchedule(idSchema.parse(req.params.id), scheduleCreateSchema.parse(req.body), auditContext(req));
  res.status(201).json({ schedule });
}

export async function updateSchedule(req: Request, res: Response) {
  const schedule = await adminService.updateSchedule(idSchema.parse(req.params.id), scheduleUpdateSchema.parse(req.body), auditContext(req));
  res.json({ schedule });
}

export async function listSettings(_req: Request, res: Response) {
  res.json({ settings: await adminService.getSettings() });
}

export async function updateSetting(req: Request, res: Response) {
  const key = z.string().trim().min(2).max(80).parse(req.params.key);
  const setting = await adminService.updateSetting(key, settingSchema.parse(req.body).value, auditContext(req));
  res.json({ setting });
}

export async function listAuditLogs(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const action = typeof req.query.action === "string" && req.query.action.trim() ? req.query.action.trim() : undefined;
  res.json({ logs: await adminService.getAuditLogs(query, action) });
}

export async function report(req: Request, res: Response) {
  const now = new Date();
  const defaultTo = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const defaultFromDate = new Date(`${defaultTo}T00:00:00.000Z`);
  defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 29);
  const fromValue = dateSchema.parse(typeof req.query.from === "string" ? req.query.from : defaultFromDate.toISOString().slice(0, 10));
  const toValue = dateSchema.parse(typeof req.query.to === "string" ? req.query.to : defaultTo);
  const dateFrom = parseVisitDate(fromValue);
  const dateTo = parseVisitDate(toValue);
  if (!dateFrom || !dateTo || dateFrom > dateTo) throw new AppError(422, "Periode laporan tidak valid.", "INVALID_REPORT_RANGE");
  res.json(await adminService.getReport(dateFrom, dateTo));
}
