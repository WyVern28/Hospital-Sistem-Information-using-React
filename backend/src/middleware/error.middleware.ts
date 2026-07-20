import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`, "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Format JSON pada request tidak valid.", code: "INVALID_JSON" });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      message: "Data yang dikirim belum valid.",
      code: "VALIDATION_ERROR",
      errors: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ message: "Data sudah terdaftar. Gunakan data lain.", code: "DUPLICATE_DATA" });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    res.status(409).json({ message: "Data masih terhubung dengan data lain atau referensinya tidak valid.", code: "RELATION_CONFLICT" });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    res.status(404).json({ message: "Data yang diminta tidak ditemukan.", code: "DATA_NOT_FOUND" });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2000") {
    res.status(422).json({ message: "Salah satu nilai melebihi panjang yang diperbolehkan.", code: "VALUE_TOO_LONG" });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, code: error.code });
    return;
  }

  console.error("Unhandled API error", error instanceof Error ? error.message : error);
  res.status(500).json({ message: "Terjadi kesalahan pada server.", code: "INTERNAL_ERROR" });
};
