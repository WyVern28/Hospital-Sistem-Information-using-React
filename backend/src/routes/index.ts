import { Router } from "express";
import authRoutes from "../routes/auth.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

router.use("/auth", authRoutes);

export default router;