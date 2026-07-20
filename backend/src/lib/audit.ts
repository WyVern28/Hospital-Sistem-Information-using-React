import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export type AuditInput = {
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

export async function recordAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId == null ? null : String(input.entityId),
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log", error instanceof Error ? error.message : error);
  }
}
