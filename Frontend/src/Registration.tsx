import { useState } from 'react'

export default function Registration() {
  const [fullName, setFullName] = useState('')
  const [nik, setNik] = useState('')
  const [phone, setPhone] = useState('')
  const [clinic, setClinic] = useState('')
  const [doctor, setDoctor] = useState('dr. Anahita Putri, Sp.PD')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('08:00 - 09:00')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    alert('Simpan & lanjutkan konfirmasi (demo)')
  }

  return (
    <div className="registration-container">
      <div className="registration-left">
        <div className="reg-card">
          <div className="reg-card-header">
            <h3>Pendaftaran Kunjungan</h3>
            <p className="muted">Silakan lengkapi formulir pendaftaran di bawah ini untuk membuat janji temu dengan dokter spesialis pilihan Anda.</p>

            <div className="steps">
              <div className="step active"><span className="num">1</span><span className="label">Pilih Poli</span></div>
              <div className="step"><span className="num">2</span><span className="label">Pilih Dokter</span></div>
              <div className="step"><span className="num">3</span><span className="label">Pilih Jadwal</span></div>
              <div className="step"><span className="num">4</span><span className="label">Konfirmasi</span></div>
            </div>
          </div>

          <form className="reg-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <div className="label-text">Nama Lengkap Pasien</div>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Budi Santoso" />
            </label>
            <label>
              <div className="label-text">NIK / No. Rekam Medis</div>
              <input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Masukkan 16 digit NIK" />
            </label>

            <label>
              <div className="label-text">Nomor Telepon (WhatsApp)</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 812345678" />
            </label>
            <label>
              <div className="label-text">Pilih Klinik/Poll</div>
              <select value={clinic} onChange={(e) => setClinic(e.target.value)}>
                <option value="">Pilih Poliklinik</option>
                <option value="internal">Penyakit Dalam</option>
                <option value="general">Umum</option>
              </select>
            </label>

            <div className="full-col">
              <div className="label-text">Pilih Dokter Spesialis</div>
              <div className="doctor-list">
                <div className={`doctor-card ${doctor.includes('Anahita') ? 'selected' : ''}`} onClick={() => setDoctor('dr. Anahita Putri, Sp.PD')}>
                  <div className="doc-thumb">A</div>
                  <div className="doc-info">
                    <strong>dr. Anahita Putri, Sp.PD</strong>
                    <div className="muted">Tersedia Hari Ini</div>
                  </div>
                  {doctor.includes('Anahita') && <div className="check">✓</div>}
                </div>
                <div className={`doctor-card ${doctor.includes('Bambang') ? 'selected' : ''}`} onClick={() => setDoctor('dr. Bambang Surya, Sp.PD')}>
                  <div className="doc-thumb">B</div>
                  <div className="doc-info">
                    <strong>dr. Bambang Surya, Sp.PD</strong>
                    <div className="muted">Tersedia Besok</div>
                  </div>
                  {doctor.includes('Bambang') && <div className="check">✓</div>}
                </div>
              </div>
            </div>

            <label>
              <div className="label-text">Tanggal Kunjungan</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              <div className="label-text">Pilihan Jam</div>
              <select value={time} onChange={(e) => setTime(e.target.value)}>
                <option>08:00 - 09:00</option>
                <option>09:00 - 10:00</option>
              </select>
            </label>

            <div className="full-col">
              <div className="label-text">Keluhan Singkat</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Jelaskan keluhan kesehatan Anda..."></textarea>
            </div>
          </div>

          <div className="reg-actions">
            <button type="button" className="btn-outline">Simpan Draft</button>
            <button type="submit" className="btn-primary">Lanjut Konfirmasi</button>
          </div>
        </form>
        </div>
      </div>

      <aside className="registration-right">
        <div className="summary-card summary-panel">
          <h4>Ringkasan Janji</h4>
          <div className="summary-row"><small>POLIKLINIK</small>
            <div className="summary-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v7c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V7l-9-5z" stroke="#0f6b4b" strokeWidth="1.2"/></svg>
              <strong>Penyakit Dalam</strong></div>
          </div>
          <div className="summary-row"><small>DOKTER</small>
            <div className="summary-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="#0f6b4b" strokeWidth="1.2"/><path d="M4 19c1.8-3.6 5.6-6 8-6s6.2 2.4 8 6" stroke="#0f6b4b" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <strong>{doctor}</strong></div>
          </div>
          <div className="summary-row"><small>WAKTU KUNJUNGAN</small>
            <div className="summary-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0f6b4b" strokeWidth="1.2"/><path d="M12 7v6l3 2" stroke="#0f6b4b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <strong>Senin, 24 Mei 2024<br/>08:00 - 09:00 WIB</strong></div>
          </div>
          <div className="note">Mohon datang 15 menit lebih awal untuk proses verifikasi data di loket pendaftaran.</div>
        </div>

        <div className="help-card help-panel">
          <h4>Butuh Bantuan?</h4>
          <p>Hubungi layanan pelanggan kami jika Anda mengalami kesulitan dalam pendaftaran.</p>
          <strong>(555) 0123-4567</strong>
        </div>
      </aside>
    </div>
  )
}
