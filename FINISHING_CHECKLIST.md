# Checklist Finishing Anahita Hospital

Dokumen ini merangkum hasil audit per 20 Juli 2026. Fondasi MVP pasien-dokter sudah berfungsi; item berikut adalah pekerjaan yang masih diperlukan sebelum sistem disebut SIMRS produksi.

## Prioritas 0 — Wajib sebelum produksi

- [ ] Ganti seluruh identitas demo: nama rumah sakit, alamat, nomor telepon, email, jam layanan, logo, foto, dokter, spesialisasi, dan jadwal yang sebenarnya.
- [ ] Pindahkan semua kredensial Docker ke secret/environment produksi; buat `JWT_SECRET` acak yang kuat dan jangan memakai password database contoh.
- [ ] Aktifkan HTTPS, reverse proxy, domain, cookie/sesi yang sesuai kebijakan, dan CORS hanya untuk origin produksi.
- [ ] Tambahkan kebijakan privasi, syarat layanan, persetujuan pemrosesan data kesehatan, retensi data, dan prosedur permintaan/koreksi data.
- [ ] Tambahkan audit log untuk login dan setiap baca/ubah data klinis, backup terenkripsi, uji restore, monitoring, alert, serta incident response.
- [ ] Lakukan security review: dependency scanning berkelanjutan, CSRF/XSS/IDOR review, rate limit berbasis infrastruktur, rotasi secret, dan penetration test.
- [ ] Tambahkan test integrasi API dengan database uji dan end-to-end untuk alur pasien serta dokter. Test unit saat ini baru mencakup utilitas tanggal dan JWT.
- [ ] Pisahkan konfigurasi development, staging, dan production. Jangan gunakan seed akun demo pada production.

## Prioritas 1 — Inti operasional rumah sakit

- [x] Portal admin operasional untuk dashboard, kunjungan, pengguna, dokter/jadwal, laporan, konfigurasi, dan audit log.
- [x] Kelola pembuatan pengguna, role, aktivasi akun, profil dokter, jadwal, dan kuota. CRUD spesialisasi, poli, serta hari libur masih menjadi pengembangan lanjutan.
- [ ] Tambahkan role dan portal petugas pendaftaran, perawat, farmasi, kasir, laboratorium, radiologi, rekam medis, serta manajemen.
- [ ] Lengkapi siklus appointment: reschedule, no-show, check-in, triase, prioritas darurat, pemanggilan antrean, dan pembatalan oleh petugas.
- [ ] Lengkapi rekam medis: vital sign, alergi, diagnosis berkode, tindakan, lampiran, revisi bertanda tangan, dan riwayat perubahan.
- [ ] Lengkapi resep/farmasi: master obat, satuan, aturan pakai terstruktur, interaksi/alergi, stok, batch, kedaluwarsa, dispensing, dan retur.
- [ ] Tambahkan tagihan, pembayaran, invoice, tarif, penjamin/asuransi, dan alur BPJS yang terverifikasi.
- [ ] Tambahkan notifikasi appointment/antrean melalui kanal resmi dan persetujuan pasien.
- [ ] Validasi aturan medis dan alur operasional bersama pihak rumah sakit; data serta klaim di UI sekarang adalah demonstrasi.

## Prioritas 2 — Pengalaman pengguna dan konten

- [x] Navigasi sudah memakai URL dan History API sehingga halaman publik dapat di-bookmark, direfresh, serta mengikuti tombol kembali/maju browser.
- [ ] Tambahkan lupa password, verifikasi email/nomor telepon, ganti password, edit profil pasien, dan manajemen sesi/perangkat.
- [ ] Tambahkan pencarian/filter dokter, filter tanggal/poli, kalender ketersediaan, pagination, dan empty/error state yang lebih lengkap.
- [ ] Hubungkan halaman layanan, tentang, dan kontak ke CMS/API agar konten tidak tertanam di source code.
- [ ] Ganti dua foto Pexels sementara di `Frontend/src/assets/` dengan foto milik rumah sakit dan perbarui alt text/kredit jika diperlukan.
- [ ] Tambahkan peta/lokasi, aksesibilitas fasilitas, informasi IGD, ambulans, nomor darurat, hak pasien, dan alur pengaduan yang sebenarnya.
- [ ] Audit aksesibilitas WCAG: navigasi keyboard penuh, focus order, screen reader, kontras, zoom 200%, error form, dan reduced motion.
- [ ] Tambahkan halaman 404/500, loading skeleton, retry, offline/slow-network handling, dan batas waktu sesi yang terlihat.
- [ ] Ganti teks legal/akreditasi hanya setelah memperoleh data resmi; jangan menampilkan klaim statistik yang belum dapat dibuktikan.

## Prioritas 3 — Integrasi dan kualitas lanjutan

- [ ] Integrasikan SATUSEHAT/BPJS/VClaim atau sistem eksternal lain setelah kebutuhan dan kredensial resmi tersedia.
- [x] Dashboard dan laporan operasional tersedia untuk admin, termasuk ekspor CSV dan cetak/PDF dari browser. Anonimisasi analitik lanjutan masih diperlukan sebelum produksi.
- [ ] Tambahkan object storage aman untuk dokumen medis dengan antivirus scan, batas ukuran/tipe, signed URL, dan retensi.
- [ ] Siapkan CI/CD: lint, unit/integration/E2E test, build image, migration check, dependency scan, staging, approval, dan rollback.
- [ ] Optimalkan gambar lokal (WebP/AVIF, ukuran responsif), caching, kompresi, observability frontend, serta target Core Web Vitals.

## Yang Sudah Diselesaikan dalam Audit Ini

- [x] Autentikasi register/login JWT, hash password, validasi, rate limit, Helmet, CORS allowlist, dan RBAC pasien/dokter.
- [x] Skema MySQL/Prisma, migration, seed demo, dokter/jadwal, appointment/antrean, SOAP, resep, dan riwayat pasien.
- [x] Portal pasien dan dokter terhubung ke API; pengecekan antrean publik tidak mengirim data pribadi.
- [x] Tampilan responsif utama, status loading/error, logout, metadata halaman, favicon, dan gambar sementara berlisensi jelas.
- [x] Header mobile ringkas, navigasi URL, pencarian/filter, proteksi sesi kedaluwarsa, error boundary, serta pencegahan catatan SOAP terbawa ke pasien lain.
- [x] Docker Compose untuk frontend, backend, MySQL, dan phpMyAdmin; health check database dan build Node 24.
- [x] Build TypeScript, lint frontend, audit dependency, smoke test alur utama, RBAC, privasi antrean, desktop, dan mobile.
