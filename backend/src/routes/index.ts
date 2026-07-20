import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import doctorRoutes from "../modules/doctors/doctor.routes.js";
import appointmentRoutes from "../modules/appointments/appointment.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "anahita-hospital-api",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/admin", adminRoutes);
router.use(appointmentRoutes);

export default router;
