import './App.css'

export default function Services() {
  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero-inner">
          <h1>Layanan Kesehatan</h1>
          <p className="muted">Kami menghadirkan berbagai layanan medis unggulan dengan dukungan tenaga ahli profesional dan teknologi terkini untuk kesehatan Anda dan keluarga.</p>

          <div className="search-box">
            <input placeholder="Cari layanan, poli, atau spesialis..." />
            <button className="btn-primary small">Cari</button>
          </div>
        </div>
      </section>

      <main className="services-section" id="services">
        <div className="service-filters">
          <button className="chip active">Semua Layanan</button>
          <button className="chip">Poliklinik</button>
          <button className="chip">Penunjang Medis</button>
          <button className="chip">Farmasi & Lab</button>
          <button className="chip">Layanan Darurat</button>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🏥</div>
            <h4>Poli Umum</h4>
            <p>Layanan konsultasi kesehatan dasar untuk pemeriksaan rutin, keluhan kesehatan ringan, dan rujukan spesialis.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">👶</div>
            <h4>Poli Anak</h4>
            <p>Perawatan komprehensif bagi bayi, anak, dan remaja dengan pendekatan yang ramah dan menenangkan.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">🫀</div>
            <h4>Poli Penyakit Dalam</h4>
            <p>Diagnosis dan perawatan kompleks untuk organ internal tubuh oleh tim dokter internis berpengalaman.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">🦷</div>
            <h4>Poli Gigi</h4>
            <p>Perawatan gigi dan mulut: pembersihan rutin hingga tindakan bedah mulut dan estetika.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">⚗️</div>
            <h4>Laboratorium</h4>
            <p>Hasil uji medis cepat dan akurat untuk mendukung diagnosa medis yang tepat sasaran.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">💊</div>
            <h4>Farmasi</h4>
            <p>Layanan obat-obatan 24 jam dengan sistem manajemen terintegrasi untuk keamanan pasien.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-card">
            <div className="service-icon">🩻</div>
            <h4>Radiologi</h4>
            <p>Fasilitas pencitraan medis canggih (X-Ray, USG, CT Scan) untuk visualisasi kondisi internal tubuh secara presisi.</p>
            <a className="detail-link">Lihat Detail →</a>
          </div>

          <div className="service-cta-large">
            <div>
              <h4>Butuh Bantuan Mendesak?</h4>
              <p>Tim darurat kami siaga 24 jam untuk melayani kebutuhan kesehatan kritis Anda.</p>
            </div>
            <div className="cta-actions">
              <button className="btn-primary">Hubungi IGD</button>
              <button className="btn-outline">Info Layanan</button>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
