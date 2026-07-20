-- Tabel PascalCase berikut berasal dari skema prototipe lama dan tidak lagi
-- digunakan oleh Prisma schema aktif. DROP menggunakan IF EXISTS agar migrasi
-- tetap aman ketika dijalankan pada instalasi baru.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `PrescriptionItem`;
DROP TABLE IF EXISTS `Prescription`;
DROP TABLE IF EXISTS `MedicalRecord`;
DROP TABLE IF EXISTS `Appointment`;
DROP TABLE IF EXISTS `DoctorSchedule`;
DROP TABLE IF EXISTS `Doctor`;
DROP TABLE IF EXISTS `Patient`;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;
