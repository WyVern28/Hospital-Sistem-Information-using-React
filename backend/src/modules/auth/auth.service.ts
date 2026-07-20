import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { recordAudit } from "../../lib/audit.js";
import { AppError } from "../../utils/errors.js";
import { signAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";

type UserWithProfiles = User & {
  patient: { id: number } | null;
  doctor: { id: number } | null;
};

function publicUser(user: UserWithProfiles) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileId: user.patient?.id ?? user.doctor?.id ?? null,
  };
}

export async function login(data: { emailOrPhone: string; password: string }) {
  const identifier = data.emailOrPhone.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: data.emailOrPhone.trim() }] },
    include: { patient: { select: { id: true } }, doctor: { select: { id: true } } },
  });

  if (!user || !user.isActive || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new AppError(401, "Email/nomor telepon atau kata sandi tidak sesuai.", "INVALID_CREDENTIALS");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  await recordAudit({ userId: user.id, action: "LOGIN", entity: "AUTH", entityId: user.id, description: `${user.name} masuk ke sistem.` });

  return {
    token: signAccessToken(user),
    user: publicUser(user),
  };
}

export async function register(data: {
  name: string;
  email: string;
  phone?: string;
  nik: string;
  password: string;
}) {
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        passwordHash,
        role: "PATIENT",
      },
    });

    await tx.patient.create({
      data: {
        userId: created.id,
        nik: data.nik,
        medicalRecordNumber: `RM-${String(created.id).padStart(8, "0")}`,
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { patient: { select: { id: true } }, doctor: { select: { id: true } } },
    });
  });

  await recordAudit({ userId: user.id, action: "REGISTER", entity: "USER", entityId: user.id, description: `${user.name} membuat akun pasien.` });

  return {
    token: signAccessToken(user),
    user: publicUser(user),
  };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: { select: { id: true } }, doctor: { select: { id: true } } },
  });

  if (!user?.isActive) {
    throw new AppError(401, "Akun tidak ditemukan atau sudah dinonaktifkan.", "INVALID_SESSION");
  }

  return publicUser(user);
}
