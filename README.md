# Anahita Hospital Information System

Proyek full-stack untuk sistem informasi rumah sakit dengan frontend React + Vite dan backend Express + TypeScript.

## Tech Stack

- Frontend: React, Vite, TypeScript
- Backend: Express, TypeScript
- Database: MySQL
- ORM: Prisma
- Keamanan: JWT, bcrypt, Helmet, rate limiting, CORS allowlist, dan RBAC
- Container: Docker dan Docker Compose

## Struktur Folder

- `Frontend/src/features/admin/` untuk portal, service, dan tipe data admin
- `Frontend/src/features/doctor/` untuk portal dokter
- `Frontend/src/features/patient/` untuk portal, route, dan halaman pasien
- `Frontend/src/features/public/` untuk halaman publik rumah sakit
- `Frontend/src/shared/` untuk komponen lintas role seperti header, footer, field, dan error boundary
- `backend/src/modules/admin/` untuk dashboard, pengguna, dokter/jadwal, laporan, konfigurasi, dan audit log
- `backend/src/modules/auth/` untuk autentikasi dan sesi
- `backend/src/modules/appointments/` untuk alur pendaftaran, antrean, SOAP, dan resep
- `backend/src/modules/doctors/` untuk katalog dokter dan jadwal publik
- `backend/src/lib/`, `middleware/`, `types/`, dan `utils/` untuk lapisan bersama
- `docker-compose.yml` untuk menjalankan seluruh layanan sekaligus

Struktur tersebut mengikuti pendekatan modular, layered architecture, dan pemisahan tanggung jawab yang dijelaskan pada SAD Anahita Hospital.

## Prasyarat

- Node.js 22.12 atau lebih baru (Node.js 24 direkomendasikan)
- npm
- Docker dan Docker Compose, jika ingin menjalankan semua service lewat container
- MySQL 8 jika menjalankan backend secara lokal tanpa Docker

## Konfigurasi Environment

### Backend

Buat file `backend/.env` dan isi minimal seperti berikut:

```env
PORT=5000
DATABASE_URL="mysql://simrs:simrs123@localhost:3307/simrs"
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"
CORS_ORIGINS="http://localhost:5173"
```

Jika backend dijalankan di dalam Docker, gunakan host database `mysql` dan port `3306`:

```env
PORT=5000
DATABASE_URL="mysql://simrs:simrs123@mysql:3306/simrs"
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"
CORS_ORIGINS="http://localhost:5173"
```

## Menjalankan Secara Lokal

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Siapkan database lalu jalankan migration dan seed sebelum server:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Backend akan berjalan di `http://localhost:5000`.

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

Default frontend mengarah ke API pada `http://localhost:5000`. Jika perlu memakai alamat lain, buat `Frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

## Menjalankan dengan Docker

Jalankan semua service sekaligus dari root project:

```bash
docker compose up --build
```

Service yang tersedia:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- phpMyAdmin: `http://localhost:8080`
- MySQL: `localhost:3307`

Docker Compose menunggu MySQL sehat sebelum memulai backend. Backend dan
frontend juga menggunakan kebijakan restart otomatis, sehingga keduanya pulih
sendiri apabila database atau Docker Desktop baru selesai menyala.

### Jika `localhost:5000` tidak dapat dibuka

Pastikan Docker Desktop sudah berjalan, lalu periksa status service dari root
project:

```bash
docker compose ps
docker compose logs --tail=100 backend
```

Status normal adalah MySQL dan backend bertanda `healthy`. Endpoint pemeriksaan
backend tersedia di `http://localhost:5000/api/health`. Jika container belum
dibuat atau source code berubah, jalankan:

```bash
docker compose up -d --build
```

## Endpoint API

Endpoint MVP yang tersedia:

- `GET /api/health` - status backend
- `POST /api/auth/register` - membuat akun pasien
- `POST /api/auth/login` - login pasien, dokter, atau admin
- `GET /api/auth/me` - sesi aktif
- `GET /api/doctors` - daftar dokter dan jadwal
- `POST /api/appointments` - pendaftaran pasien
- `GET /api/appointments/my` - riwayat pasien
- `GET /api/queue/:queueCode` - status antrean publik tanpa data pribadi
- `GET /api/doctor/appointments` - antrean milik dokter
- `PATCH /api/doctor/appointments/:id/start` - mulai pemeriksaan
- `POST /api/doctor/appointments/:id/examination` - simpan SOAP/resep dan selesaikan pemeriksaan
- `GET /api/admin/dashboard` - ringkasan operasional admin
- `GET /api/admin/appointments` - daftar seluruh kunjungan
- `PATCH /api/admin/appointments/:id/status` - memperbarui status kunjungan
- `GET /api/admin/users` - daftar pengguna sistem
- `POST /api/admin/users` - membuat akun pasien, dokter, atau admin
- `PATCH /api/admin/users/:id/status` - mengaktifkan atau menonaktifkan akun
- `PATCH /api/admin/users/:id/role` - memperbarui role pengguna
- `GET /api/admin/doctors` - daftar dokter beserta jadwal
- `PATCH /api/admin/doctors/:id` - memperbarui profil dokter
- `POST /api/admin/doctors/:id/schedules` - menambahkan jadwal praktik
- `PATCH /api/admin/schedules/:id` - memperbarui atau menonaktifkan jadwal
- `GET /api/admin/reports` - laporan kunjungan dan kinerja dokter berdasarkan periode
- `GET /api/admin/settings` - konfigurasi operasional SIMRS
- `PATCH /api/admin/settings/:key` - memperbarui konfigurasi
- `GET /api/admin/audit-logs` - aktivitas penting pengguna dan admin

Endpoint privat membutuhkan header `Authorization: Bearer <token>` dan dibatasi sesuai role.

## Akun Demo

- Pasien: `pasien@anahita.test` / `pasien123`
- Dokter: `dokter@anahita.test` / `dokter123`
- Admin: `admin@anahita.test` / `admin123`

Akun ini hanya untuk pengembangan dengan data fiktif.

## Cakupan Portal Admin

Portal admin mengikuti prioritas Product Backlog laporan Scrum:

- Sprint/Release 2 aktif: manajemen akun dan role, profil dokter, jadwal praktik, kuota, serta konfigurasi sistem.
- Audit log mencatat login, pendaftaran, perubahan kunjungan, pemeriksaan, akun, dokter, jadwal, dan konfigurasi.
- Laporan operasional menampilkan kunjungan, pasien baru, status pemeriksaan, dan kinerja dokter; laporan dapat dicetak menjadi PDF dan diunduh sebagai spreadsheet CSV.
- Farmasi, stok obat, kasir, tagihan, dan laporan pendapatan tetap ditandai sebagai Release 3–4 karena model transaksi modul tersebut belum tersedia. Portal tidak menampilkan angka pendapatan fiktif.

## Asset Gambar Sementara

Gambar dapat diganti langsung tanpa mengubah komponen:

- `Frontend/src/assets/hospital-hero.jpg` - foto konsultasi oleh AI25.Studio Studio, [Pexels](https://www.pexels.com/photo/woman-consulting-a-doctor-5215008/)
- `Frontend/src/assets/medical-team.jpg` - foto tim medis oleh RDNE Stock project, [Pexels](https://www.pexels.com/photo/medical-practitioners-having-a-discussion-6129586/)
- `Frontend/src/assets/doctors/` - potret dokter untuk kartu dokter (aset Figma dan potret fiktif hasil generasi AI)

## Build untuk Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd Frontend
npm run build
npm run preview
```

## Catatan

- Nama folder frontend menggunakan huruf besar: `Frontend/`.
- Jika port MySQL di mesin lokal bentrok, sesuaikan port `3307` di `docker-compose.yml` atau `DATABASE_URL` di `.env`.
- Seed bersifat non-destruktif: data demo yang belum tersedia akan dibuat, tetapi perubahan akun, dokter, jadwal, dan konfigurasi dari portal admin tidak ditimpa saat backend restart.
