import assert from "node:assert/strict";
import test from "node:test";
import { dayOfWeek, parseVisitDate } from "./dates.js";

test("parseVisitDate menerima tanggal ISO yang valid", () => {
  const date = parseVisitDate("2026-07-20");

  assert.ok(date);
  assert.equal(date.toISOString(), "2026-07-20T00:00:00.000Z");
});

test("parseVisitDate menolak tanggal mustahil dan format lain", () => {
  assert.equal(parseVisitDate("2026-02-30"), null);
  assert.equal(parseVisitDate("20-07-2026"), null);
  assert.equal(parseVisitDate(""), null);
});

test("dayOfWeek memakai hari UTC yang stabil di semua zona waktu", () => {
  const date = parseVisitDate("2026-07-20");

  assert.ok(date);
  assert.equal(dayOfWeek(date), "MONDAY");
});
