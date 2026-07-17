import { Router } from "express";

const router = Router();

router.post("/login", (req, res) => {
  console.log("LOGIN ROUTE HIT");

  res.json({
    success: true,
    message: "Login route works",
  });
});

export default router;