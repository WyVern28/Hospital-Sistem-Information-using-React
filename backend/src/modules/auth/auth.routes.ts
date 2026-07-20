import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, me, register } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.", code: "RATE_LIMITED" },
});

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);
router.get("/me", authenticate, me);

export default router;
