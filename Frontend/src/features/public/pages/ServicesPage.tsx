import { useMemo, useState } from 'react'
import { Baby, Beaker, HeartPulse, Pill, Search, Stethoscope, ScanLine } from 'lucide-react'
import type { Page } from '../../../types'

const services = [
  { name: 'Poli Umum', type: 'Poliklinik', Icon: Stethoscope, text: 'Konsultasi kesehatan dasar, pemeriksaan rutin, dan rujukan.' },
  { name: 'Poli Anak', type: 'Poliklinik', Icon: Baby, text: 'Pelayanan untuk bayi, anak, dan remaja dengan pendekatan ramah keluarga.' },
  { name: 'Penyakit Dalam', type: 'Poliklinik', Icon: HeartPulse, text: 'Diagnosis dan penanganan gangguan organ dalam secara terpadu.' },
  { name: 'Laboratorium', type: 'Penunjang', Icon: Beaker, text: 'Pemeriksaan laboratorium untuk mendukung diagnosis dokter.' },
  { name: 'Radiologi', type: 'Penunjang', Icon: ScanLine, text: 'Layanan X-Ray, USG, dan pencitraan medis sesuai kebutuhan klinis.' },
  { name: 'Farmasi', type: 'Farmasi', Icon: Pill, text: 'Pelayanan resep dan informasi penggunaan obat untuk pasien.' },
]

const categories = ['Semua', 'Poliklinik', 'Penunjang', 'Farmasi']

export default function ServicesPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [filter, setFilter] = useState('Semua')
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return services.filter(service =>
      (filter === 'Semua' || service.type === filter)
      && `${service.name} ${service.type} ${service.text}`.toLowerCase().includes(normalized),
    )
  }, [filter, query])

  return <main><section className="page-hero"><span className="eyebrow">PELAYANAN TERINTEGRASI</span><h1>Layanan Kesehatan</h1><p>Temukan layanan yang sesuai dengan kebutuhan Anda dan keluarga.</p><div className="search"><label className="sr-only" htmlFor="service-search">Cari layanan</label><input id="service-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari layanan, kategori, atau pemeriksaan..." /><Search size={20} aria-hidden="true" /></div></section><section className="section services-section"><div className="filter-row" aria-label="Filter kategori layanan">{categories.map(category => <button key={category} className={filter === category ? 'chip active' : 'chip'} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category === 'Semua' ? 'Semua Layanan' : category}</button>)}</div><p className="result-count" aria-live="polite">Menampilkan {visible.length} layanan</p><div className="card-grid three">{visible.map(({ Icon, ...service }) => <article className="info-card service-card" key={service.name}><div className="icon-box"><Icon size={23} /></div><span className="card-category">{service.type}</span><h3>{service.name}</h3><p>{service.text}</p><button className="link-button" onClick={() => onNavigate('registration')}>Buat janji <span aria-hidden="true">→</span></button></article>)}</div>{!visible.length && <div className="empty-panel"><Search size={28} /><h2>Layanan tidak ditemukan</h2><p>Coba gunakan kata kunci lain atau pilih kategori berbeda.</p><button className="button secondary" onClick={() => { setQuery(''); setFilter('Semua') }}>Atur ulang pencarian</button></div>}</section></main>
}
