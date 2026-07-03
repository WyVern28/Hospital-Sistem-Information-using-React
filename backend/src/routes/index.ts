import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.json
    ({ message: "config nyala" });
});

export default router;