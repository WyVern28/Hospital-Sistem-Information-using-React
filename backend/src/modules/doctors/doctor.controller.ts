import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const idSchema = z.coerce.number().int().positive();

const scheduleSelect = {
  id: true,
  code: true,
  day: true,
  startTime: true,
  endTime: true,
  quota: true,
} as const;

export async function listDoctors(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const doctors = await prisma.doctor.findMany({
    where: {
      user: { isActive: true, role: "DOCTOR" },
      ...(query ? {
        OR: [
          { user: { name: { contains: query } } },
          { specialty: { name: { contains: query } } },
        ],
      } : {}),
    },
    select: {
      id: true,
      licenseNumber: true,
      experienceYears: true,
      bio: true,
      user: { select: { name: true } },
      specialty: { select: { id: true, name: true, description: true } },
      schedules: { where: { isActive: true }, select: scheduleSelect, orderBy: [{ day: "asc" }, { startTime: "asc" }] },
    },
    orderBy: { user: { name: "asc" } },
  });

  res.json({ doctors });
}

export async function listSchedules(req: Request, res: Response) {
  const doctorId = idSchema.parse(req.params.id);
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId, isActive: true, doctor: { user: { isActive: true, role: "DOCTOR" } } },
    select: scheduleSelect,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  res.json({ schedules });
}
