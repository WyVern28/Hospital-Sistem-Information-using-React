import type { Request } from "express";
import type { UserRole } from "@prisma/client";

export type AuthenticatedRequest = Request & {
  auth: {
    userId: number;
    role: UserRole;
    email: string;
  };
};
