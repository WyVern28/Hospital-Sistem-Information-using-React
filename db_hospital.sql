-- Berkas kompatibilitas untuk pengguna MySQL CLI.
-- Sumber skema yang resmi adalah migration Prisma di backend/prisma/migrations.
-- Jalankan berkas ini dari root repository agar perintah SOURCE dapat ditemukan.

CREATE DATABASE IF NOT EXISTS simrs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE simrs;

SOURCE backend/prisma/migrations/20260719190000_init/migration.sql;
SOURCE backend/prisma/migrations/20260720143000_admin_management/migration.sql;
SOURCE backend/prisma/migrations/20260720154500_remove_empty_legacy_tables/migration.sql;
