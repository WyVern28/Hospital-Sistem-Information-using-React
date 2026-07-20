import { useCallback, useEffect, useMemo, useState } from 'react'
import { BriefcaseMedical, CalendarDays, RefreshCw, Search, Stethoscope } from 'lucide-react'
import { api, apiErrorMessage } from '../../../services/api'
import type { Doctor, Page } from '../../../types'
import { dayLabels, formatTime } from '../../../utils/format'
import drAnahita from '../../../assets/doctors/dr-anahita.jpg'
import drBagas from '../../../assets/doctors/dr-bagas.jpg'
import drCitra from '../../../assets/doctors/dr-citra.webp'
import drDimas from '../../../assets/doctors/dr-dimas.webp'

const doctorPhotos = [drAnahita, drBagas, drCitra, drDimas]

export default function DoctorsPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [query, setQuery] = useState('')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDoctors = useCallback((signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    api.get<{ doctors: Doctor[] }>('/doctors', { signal })
      .then(({ data }) => setDoctors(data.doctors))
      .catch(reason => { if (reason.code !== 'ERR_CANCELED') setError(apiErrorMessage(reason)) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    api.get<{ doctors: Doctor[] }>('/doctors', { signal: controller.signal })
      .then(({ data }) => setDoctors(data.doctors))
      .catch(reason => { if (reason.code !== 'ERR_CANCELED') setError(apiErrorMessage(reason)) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => doctors.filter(doctor =>
    `${doctor.user.name} ${doctor.specialty.name}`.toLowerCase().includes(query.toLowerCase()),
  ), [doctors, query])

  return <main>
    <section className="page-hero compact">
      <span className="eyebrow">TENAGA MEDIS PROFESIONAL</span>
      <h1>Dokter & Jadwal Praktik</h1>
      <p>Pilih dokter spesialis dan waktu konsultasi yang sesuai untuk Anda.</p>
      <div className="search"><label className="sr-only" htmlFor="doctor-search">Cari dokter</label><input id="doctor-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nama dokter atau spesialis..." /><Search size={20} aria-hidden="true" /></div>
    </section>
    <section className="section" aria-live="polite">
      {loading && <div className="loading-panel"><span className="spinner" aria-hidden="true" /><p>Memuat dokter dan jadwal...</p></div>}
      {error && <div className="empty-panel error-state" role="alert"><RefreshCw size={28} /><h2>Jadwal belum dapat dimuat</h2><p>{error}</p><button className="button secondary" onClick={() => loadDoctors()}>Coba lagi</button></div>}
      {!loading && !error && filtered.length > 0 && <p className="doctor-result-count">Menampilkan {filtered.length} dokter yang siap membantu Anda</p>}
      {!loading && !error && <div className="doctor-grid">{filtered.map(doctor => <article className="doctor-card" key={doctor.id}>
        <div className="doctor-avatar"><img src={doctorPhotos[(doctor.id - 1) % doctorPhotos.length]} alt={`Foto ${doctor.user.name}`} loading="lazy" decoding="async" /></div>
        <div className="doctor-content"><span className="availability">{doctor.schedules.length ? 'Jadwal tersedia' : 'Belum ada jadwal'}</span><h3>{doctor.user.name}</h3><p className="doctor-bio">{doctor.bio ?? 'Tenaga medis Anahita Hospital.'}</p>
          <div className="doctor-meta"><span><Stethoscope size={15} /> {doctor.specialty.name}</span><span><BriefcaseMedical size={15} /> {doctor.experienceYears} tahun</span></div>
          <div className="schedule-list">{doctor.schedules.slice(0, 3).map(schedule => <span key={schedule.id}><CalendarDays size={14} /> {dayLabels[schedule.day]}, {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)}</span>)}</div>
          <button className="button primary small" disabled={!doctor.schedules.length} onClick={() => onNavigate('registration')}>Buat Janji</button>
        </div>
      </article>)}</div>}
      {!loading && !error && !filtered.length && <div className="empty-panel"><Search size={28} /><h2>Dokter tidak ditemukan</h2><p>Coba cari nama atau spesialisasi lain.</p><button className="button secondary" onClick={() => setQuery('')}>Hapus pencarian</button></div>}
    </section>
  </main>
}
