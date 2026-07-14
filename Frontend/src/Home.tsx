import './App.css'

export default function Home({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="home-root">
      <section className="hero-section">
        <div className="hero-content">
          <span className="badge">Terakreditasi Paripurna Kemenkes RI</span>
          <h1>Anahita Hospital</h1>
          <h2 className="hero-sub">Layanan Kesehatan Digital yang Mudah dan Terintegrasi</h2>
          <p className="lead">Dapatkan kemudahan akses pendaftaran online, pengecekan antrean secara real-time, dan konsultasi dengan dokter spesialis berpengalaman di Anahita Hospital.</p>
          <div className="hero-ctas">
            <button className="btn-primary large">Daftar Kunjungan</button>
            <button className="btn-outline large">Lihat Jadwal Dokter</button>
          </div>
          <div className="trust-row">
            <div className="trust-avatars">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="avatar-sm" />
            ))}</div>
            <div className="trust-text">150+ Dokter Spesialis Siap Melayani Anda</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="device-wrap">
            <div className="device-image" />
            <div className="floating-card floating-left">
              <div className="fc-title">Nomor Antrean</div>
              <div className="fc-value">A-012</div>
            </div>
            <div className="floating-card floating-right">
              <div className="fc-title">24/7 IGD & Farmasi</div>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section">
        <h3>Layanan Unggulan Kami</h3>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">❤️</div>
            <h4>Pusat Jantung</h4>
            <p>Perawatan komprehensif untuk pencegahan dan terapi penyakit jantung.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🧠</div>
            <h4>Saraf & Otak</h4>
            <p>Penanganan terpadu untuk gangguan sistem saraf.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🤱</div>
            <h4>Ibu & Anak</h4>
            <p>Perawatan khusus untuk ibu dan tumbuh kembang anak.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🧾</div>
            <h4>MCU Digital</h4>
            <p>Pemeriksaan kesehatan menyeluruh dengan hasil digital yang cepat.</p>
          </div>
        </div>
      </section>

      <section className="howto">
        <h3>Langkah Mudah Pendaftaran Online</h3>
        <div className="steps">
          <div className="step">1. Cari Dokter</div>
          <div className="step">2. Isi Formulir</div>
          <div className="step">3. Dapatkan Kode</div>
          <div className="step">4. Kunjungi RS</div>
        </div>
        <div className="center-cta"><button className="btn-primary">Mulai Daftar Sekarang</button></div>
      </section>

      <section className="contact-cta">
        <div className="contact-inner">
          <div>
            <h3>Butuh Bantuan Mendesak atau Konsultasi Cepat?</h3>
            <p>Tim Customer Support kami tersedia 24 jam untuk melayani kebutuhan informasi kesehatan Anda.</p>
            <div className="contact-buttons">
              <button className="btn-outline">Telepon Darurat</button>
              <button className="btn-primary" onClick={onLogin}>Check Queue</button>
            </div>
          </div>
          <div className="contact-box">
            <div className="contact-card">
              <div className="stat">98%</div>
              <div className="stat-label">Tingkat Kepuasan Pasien</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="brand-block">
            <div className="brand-logo">🏥</div>
            <div>Anahita Hospital</div>
            <small>Rumah sakit masa depan dengan pelayanan yang mengutamakan manusia melalui integrasi teknologi digital.</small>
          </div>

          <div className="links">
            <h5>Navigasi Cepat</h5>
            <ul>
              <li>Tentang Kami</li>
              <li>Layanan Medis</li>
              <li>Fasilitas RS</li>
            </ul>
          </div>

          <div className="contact">
            <h5>Kontak & Alamat</h5>
            <p>Address: 123 Healthcare Way, Jakarta</p>
            <p>Phone: (555) 0123-4567</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
