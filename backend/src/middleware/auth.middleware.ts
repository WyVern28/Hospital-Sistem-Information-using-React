import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/http.js";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new AppError(401, "Silakan masuk untuk melanjutkan.", "AUTH_REQUIRED");
    }

    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true, isActive: true },
    });

    if (!Number.isInteger(userId) || !user?.isActive) {
      throw new AppError(401, "Sesi tidak valid atau akun sudah dinonaktifkan.", "INVALID_SESSION");
    }

    (req as AuthenticatedRequest).auth = {
      userId,
      // Gunakan role terbaru dari database agar perubahan role oleh admin
      // langsung berlaku tanpa menunggu token lama kedaluwarsa.
      role: user.role,
      email: user.email,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, "Sesi telah berakhir. Silakan masuk kembali.", "INVALID_SESSION"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { role } = (req as AuthenticatedRequest).auth;

    if (!roles.includes(role)) {
      return next(new AppError(403, "Anda tidak memiliki hak akses untuk tindakan ini.", "FORBIDDEN"));
    }

    next();
  };
}
