import { Router } from "express";
import {
  cancelAppointment,
  completeExamination,
  createAppointment,
  doctorAppointments,
  myAppointments,
  publicQueue,
  startExamination,
  updateAppointment,
} from "./appointment.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/queue/:queueCode", publicQueue);
router.post("/appointments", authenticate, requireRole("PATIENT"), createAppointment);
router.get("/appointments/my", authenticate, requireRole("PATIENT"), myAppointments);
router.patch("/appointments/:id", authenticate, requireRole("PATIENT"), updateAppointment);
router.delete("/appointments/:id", authenticate, requireRole("PATIENT"), cancelAppointment);
router.get("/doctor/appointments", authenticate, requireRole("DOCTOR"), doctorAppointments);
router.patch("/doctor/appointments/:id/start", authenticate, requireRole("DOCTOR"), startExamination);
router.post("/doctor/appointments/:id/examination", authenticate, requireRole("DOCTOR"), completeExamination);

export default router;
