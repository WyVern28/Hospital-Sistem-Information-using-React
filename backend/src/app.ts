import express from "express";
import cors from "cors";
import helmet from "helmet";

import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { AppError } from "./utils/errors.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new AppError(403, "Origin tidak diizinkan oleh CORS.", "CORS_FORBIDDEN"));
  },
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => res.json({ message: "Anahita Hospital API", health: "/api/health" }));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
