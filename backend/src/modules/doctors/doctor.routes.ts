import { Router } from "express";
import { listDoctors, listSchedules } from "./doctor.controller.js";

const router = Router();

router.get("/", listDoctors);
router.get("/:id/schedules", listSchedules);

export default router;
