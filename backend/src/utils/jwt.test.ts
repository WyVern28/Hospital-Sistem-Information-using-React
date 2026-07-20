import assert from "node:assert/strict";
import test from "node:test";
import { signAccessToken, verifyAccessToken } from "./jwt.js";

test("access token mempertahankan identitas dan role pengguna", () => {
  const token = signAccessToken({ id: 42, email: "pasien@example.test", role: "PATIENT" });
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, "42");
  assert.equal(payload.email, "pasien@example.test");
  assert.equal(payload.role, "PATIENT");
  assert.equal(payload.iss, "anahita-hospital");
});

test("token dengan signature tidak valid ditolak", () => {
  const token = signAccessToken({ id: 42, email: "pasien@example.test", role: "PATIENT" });
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

  assert.throws(() => verifyAccessToken(tampered));
});
