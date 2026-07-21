# Naskah Presentasi — Anahita Hospital Information System

Dokumen ini disusun mengikuti rubrik penilaian proyek sistem informasi rumah sakit.

## 1. Latar Belakang dan Analisis Kebutuhan — Bobot 10%

### Narasi presentasi

Anahita Hospital Information System dibuat untuk membantu digitalisasi proses pelayanan rumah sakit, khususnya pendaftaran pasien, pengelolaan jadwal dokter, antrean, pemeriksaan, rekam medis, resep, dan administrasi operasional. Sebelum sistem terintegrasi, proses-proses tersebut berisiko dilakukan secara terpisah sehingga pelayanan menjadi kurang efisien dan data lebih sulit dipantau.

Tujuan sistem kami adalah menyediakan aplikasi web yang memudahkan pasien memperoleh layanan, membantu dokter melakukan pemeriksaan, dan membantu admin mengelola data operasional rumah sakit.

### Aktor sistem

| Aktor | Peran utama |
|---|---|
| Pasien | Registrasi, login, melihat dokter/jadwal, membuat appointment, dan memantau antrean. |
| Dokter | Melihat antrean pasien, melakukan pemeriksaan, mengisi SOAP, diagnosis, tindakan, dan resep. |
| Admin | Mengelola pengguna, dokter, jadwal, kunjungan, laporan, konfigurasi, serta audit log. |

### Kebutuhan

- **Fungsional:** autentikasi, pembatasan role, daftar dokter, jadwal praktik, appointment, nomor antrean, rekam medis SOAP, resep, dashboard, laporan, dan audit log.
- **Non-fungsional:** antarmuka responsif, validasi input, keamanan JWT dan bcrypt, RBAC, Helmet, rate limiting, CORS allowlist, serta kemudahan deployment melalui Docker.

## 2. Pemodelan Sistem (UML) — Bobot 15%

### Narasi presentasi

Use Case Diagram menggambarkan interaksi tiga aktor utama dengan sistem. Pasien melakukan pendaftaran dan memantau antrean; dokter melakukan pemeriksaan; sedangkan admin mengelola data dan operasional.

### Alur Activity Diagram appointment

`Pasien login → memilih dokter dan jadwal → mengisi keluhan → sistem memeriksa kuota → sistem membuat appointment dan nomor antrean → pasien memantau antrean → dokter melakukan pemeriksaan → dokter menyimpan SOAP dan resep → kunjungan selesai.`

### Class/ERD utama

- `User` menyimpan akun, password hash, dan role.
- `Patient` terhubung dengan satu `User` pasien.
- `Doctor` terhubung dengan satu `User` dokter dan satu `Specialty`.
- `DoctorSchedule` dimiliki oleh dokter.
- `Appointment` menghubungkan pasien, dokter, dan jadwal.
- `MedicalRecord` dibuat dari appointment dan menyimpan data SOAP.
- `Prescription` dan `PrescriptionDetail` menyimpan resep dokter.
- `AuditLog` menyimpan aktivitas penting pengguna.

Model tersebut diimplementasikan di MySQL menggunakan Prisma ORM, sehingga relasi model aplikasi dan database konsisten.

## 3. Arsitektur dan Desain Sistem — Bobot 10%

### Narasi presentasi

Sistem menggunakan arsitektur **client-server** dengan pendekatan **modular layered architecture**.

```text
React + TypeScript (Frontend)
          │ REST API / HTTP
Express + TypeScript (Backend)
          │ Prisma ORM
       MySQL Database
```

Frontend dipisahkan berdasarkan fitur dan peran, seperti `patient`, `doctor`, `admin`, `public`, serta komponen bersama. Backend dipisahkan menjadi modul `auth`, `appointments`, `doctors`, dan `admin`, dengan controller, service, route, middleware, dan utility.

Arsitektur ini dipilih agar kode lebih rapi, mudah dirawat, dan mudah dikembangkan untuk modul berikutnya seperti farmasi, kasir, laboratorium, atau radiologi.

## 4. UI/UX Design — Bobot 10%

### Narasi presentasi

Antarmuka dibuat berdasarkan kebutuhan tiap pengguna. Pasien memiliki alur sederhana untuk mencari dokter, memilih jadwal, mendaftar, dan melihat antrean. Dokter berfokus pada antrean dan proses pemeriksaan. Admin memiliki dashboard untuk pengelolaan operasional.

Sistem telah memiliki navigasi berbasis URL, desain responsif desktop/mobile, indikator loading dan error, logout, serta error boundary. Tunjukkan dokumen UI/UX dan beberapa halaman utama saat mempresentasikan bagian ini.

## 5. Implementasi Sistem — Bobot 20%

### Narasi presentasi

Fitur utama yang berhasil kami implementasikan adalah:

- Registrasi dan login untuk pasien, dokter, dan admin.
- Role-Based Access Control (RBAC) untuk membatasi akses sesuai role.
- Katalog dokter dan jadwal praktik.
- Pendaftaran appointment dengan validasi kuota.
- Nomor dan kode antrean.
- Status antrean publik tanpa membuka data pribadi pasien.
- Portal dokter untuk pemeriksaan, SOAP, diagnosis, tindakan, dan resep.
- Portal admin untuk dashboard, kunjungan, pengguna, dokter/jadwal, laporan, konfigurasi, serta audit log.
- Ekspor laporan CSV dan cetak/PDF dari browser.

Teknologi yang digunakan adalah React, Vite, TypeScript, Express, MySQL, Prisma, Docker, JWT, dan bcrypt. Kode dipisahkan per fitur dan lapisan agar mengikuti prinsip clean code dan separation of concerns.

## 6. Agile Software Development — Bobot 10%

### Narasi presentasi

Kami menggunakan pendekatan Scrum. Kebutuhan dikumpulkan dalam Product Backlog, diprioritaskan pada Sprint Planning, dikerjakan dalam Sprint Backlog, kemudian diuji dan dievaluasi.

### Contoh prioritas backlog

1. Autentikasi, data pasien, dokter, dan jadwal.
2. Appointment, antrean, portal pasien, dan portal dokter.
3. Dashboard admin, manajemen pengguna, laporan, audit log, dan konfigurasi.
4. Pengembangan berikutnya: farmasi, stok obat, kasir, pembayaran, BPJS, laboratorium, dan radiologi.

Pembagian tugas dapat dijelaskan berdasarkan frontend/UI-UX, backend/database, testing, dokumentasi, serta integrasi/deployment. Gunakan dokumen Scrum tim sebagai bukti backlog dan sprint.

## 7. Software Testing — Bobot 10%

### Narasi presentasi

Pengujian utama menggunakan Black Box Testing, yaitu memeriksa apakah setiap fungsi memberikan hasil yang sesuai dari sudut pandang pengguna.

| Fitur | Skenario uji | Hasil yang diharapkan |
|---|---|---|
| Login | Email dan password valid | Pengguna masuk ke portal sesuai role. |
| Login | Password salah | Sistem menampilkan pesan gagal login. |
| Appointment | Jadwal tersedia | Appointment dan nomor antrean berhasil dibuat. |
| Appointment | Pendaftaran ganda pada jadwal sama | Sistem menolak data duplikat. |
| Pemeriksaan | Dokter menyimpan SOAP dan resep | Rekam medis tersimpan dan kunjungan selesai. |
| RBAC | Pasien mencoba membuka endpoint admin | Sistem menolak akses. |
| Antrean publik | Kode antrean valid | Status antrean tampil tanpa data pribadi pasien. |

Selain Black Box Testing, tersedia unit test untuk utilitas JWT dan tanggal. Tunjukkan dokumen laporan Black Box Testing dan hasil UAT tim.

## 8. Software Maintenance — Bobot 5%

### Narasi presentasi

Sistem saat ini merupakan MVP yang siap didemonstrasikan, tetapi belum ditujukan sebagai sistem rumah sakit produksi penuh. Rencana maintenance dan pengembangan mencakup:

- Penambahan farmasi, stok obat, kasir, tagihan, laboratorium, radiologi, dan integrasi BPJS/SATUSEHAT.
- Penambahan role petugas pendaftaran, perawat, farmasi, laboratorium, dan rekam medis.
- Pengembangan appointment seperti reschedule, check-in, triase, no-show, dan notifikasi.
- Penambahan integration test serta end-to-end test.
- Penguatan produksi: HTTPS, backup terenkripsi, monitoring, CI/CD, security review, dan pengelolaan secret.

Data demo tetap harus diganti dengan data resmi dan alur medis perlu divalidasi bersama pihak rumah sakit sebelum digunakan secara nyata.

## 9. Demonstrasi Produk — Bobot 5%

### Urutan demo yang disarankan

1. Buka halaman publik dan daftar dokter.
2. Login sebagai pasien.
3. Buat appointment dengan memilih dokter serta jadwal.
4. Tampilkan nomor/kode antrean dan riwayat appointment.
5. Login sebagai dokter, buka antrean pasien, lalu isi SOAP dan resep.
6. Login sebagai admin, tampilkan dashboard, data kunjungan, jadwal dokter, laporan, dan audit log.
7. Tunjukkan bahwa pasien tidak dapat membuka halaman admin sebagai bukti RBAC.

### Akun demo

| Role | Email | Password |
|---|---|---|
| Pasien | pasien@anahita.test | pasien123 |
| Dokter | dokter@anahita.test | dokter123 |
| Admin | admin@anahita.test | admin123 |

## 10. Tanya Jawab — Bobot 5%

### Mengapa menggunakan React dan Express?

React memudahkan pembuatan antarmuka yang modular dan responsif. Express ringan dan fleksibel untuk membangun REST API berbasis TypeScript.

### Mengapa menggunakan Prisma?

Prisma membuat model database, relasi, query, dan migration lebih terstruktur sehingga pengembangan backend lebih aman dan mudah dirawat.

### Bagaimana keamanan sistem dijaga?

Password disimpan dalam bentuk hash menggunakan bcrypt. Sistem menggunakan JWT untuk autentikasi, RBAC untuk pembatasan role, serta Helmet, rate limiting, validasi input, dan CORS allowlist untuk melindungi API.

### Mengapa antrean publik tidak menampilkan identitas pasien?

Hal tersebut dilakukan untuk menjaga kerahasiaan data pasien. Halaman publik hanya menampilkan status berdasarkan kode antrean.

### Apa keterbatasan sistem?

Sistem belum memiliki modul lengkap seperti farmasi, pembayaran, BPJS, laboratorium, serta radiologi. Sistem juga masih menggunakan data demonstrasi, sehingga perlu validasi operasional dan keamanan sebelum digunakan di rumah sakit sebenarnya.

## Penutup

Anahita Hospital Information System telah mengimplementasikan alur inti pasien, dokter, dan admin dalam satu sistem terintegrasi. Pengembangan berikutnya berfokus pada kelengkapan modul operasional serta kesiapan keamanan dan infrastruktur untuk produksi.
