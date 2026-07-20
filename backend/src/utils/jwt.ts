import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

export type AuthPayload = JwtPayload & {
  sub: string;
  role: UserRole;
  email: string;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET wajib diisi minimal 32 karakter.");
    }

    return "anahita-development-secret-change-me";
  }

  return secret;
}

export function signAccessToken(user: { id: number; email: string; role: UserRole }) {
  return jwt.sign(
    { role: user.role, email: user.email },
    jwtSecret(),
    { subject: String(user.id), expiresIn: "8h", issuer: "anahita-hospital" },
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, jwtSecret(), { issuer: "anahita-hospital" }) as AuthPayload;
}
