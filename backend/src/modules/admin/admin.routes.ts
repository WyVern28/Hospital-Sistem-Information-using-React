import { Router } from "express";
import {
  createSchedule,
  createUser,
  dashboard,
  listAuditLogs,
  listAppointments,
  listDoctors,
  listSettings,
  listSpecialties,
  listUsers,
  report,
  updateAppointmentStatus,
  updateDoctor,
  updateSchedule,
  updateSetting,
  updateUserRole,
  updateUserStatus,
} from "./admin.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));
router.get("/dashboard", dashboard);
router.get("/appointments", listAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);
router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.get("/specialties", listSpecialties);
router.get("/doctors", listDoctors);
router.patch("/doctors/:id", updateDoctor);
router.post("/doctors/:id/schedules", createSchedule);
router.patch("/schedules/:id", updateSchedule);
router.get("/settings", listSettings);
router.patch("/settings/:key", updateSetting);
router.get("/audit-logs", listAuditLogs);
router.get("/reports", report);

export default router;
