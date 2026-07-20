import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./auth.service.js";
import type { AuthenticatedRequest } from "../../types/http.js";

const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(3).max(191),
  password: z.string().min(8).max(128),
});

const registerSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(191),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/).optional().or(z.literal("")),
  nik: z.string().regex(/^[0-9]{16}$/, "NIK harus terdiri dari 16 digit."),
  password: z.string().min(8).max(128),
});

export async function login(req: Request, res: Response) {
  const result = await authService.login(loginSchema.parse(req.body));
  res.status(200).json(result);
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(registerSchema.parse(req.body));
  res.status(201).json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser((req as AuthenticatedRequest).auth.userId);
  res.json({ user });
}
