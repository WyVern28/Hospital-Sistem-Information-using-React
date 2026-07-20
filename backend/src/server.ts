import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const { default: app } = await import("./app.js");

const PORT = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT harus berupa angka antara 1 dan 65535.");
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Anahita Hospital API berjalan di http://localhost:${PORT}`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Menerima ${signal}, menghentikan API dengan aman.`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async (error) => {
    await prisma.$disconnect();
    if (error) {
      console.error("Gagal menghentikan server", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
