import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardPlus, Clock3, LogOut, PlayCircle, RefreshCw, RotateCcw, Users } from 'lucide-react'
import Field from '../../../shared/components/ui/Field'
import { api, apiErrorMessage } from '../../../services/api'
import type { Appointment, AuthSession } from '../../../types'
import { formatDate, formatTime, statusLabels } from '../../../utils/format'

type DoctorPortalProps = {
  session: AuthSession
  onLogout: () => void
}

const initialExam = {
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  diagnosis: '',
  treatment: '',
  notes: '',
  medicineName: '',
  quantity: '1',
  dosage: '',
  instruction: '',
}

export default function DoctorPortal({ session, onLogout }: DoctorPortalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [exam, setExam] = useState(initialExam)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState<'ALL' | Appointment['status']>('ALL')

  const loadAppointments = useCallback(async () => {
    try {
      const { data } = await api.get<{ appointments: Appointment[] }>('/doctor/appointments')
      setAppointments(data.appointments)
      setSelected(current => current ? data.appointments.find(item => item.id === current.id) ?? null : null)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    api.get<{ appointments: Appointment[] }>('/doctor/appointments', { signal: controller.signal })
      .then(({ data }) => setAppointments(data.appointments))
      .catch(reason => { if (reason.code !== 'ERR_CANCELED') setError(apiErrorMessage(reason)) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const metrics = useMemo(() => ({
    waiting: appointments.filter(item => item.status === 'WAITING').length,
    examining: appointments.filter(item => item.status === 'IN_EXAMINATION').length,
    completed: appointments.filter(item => item.status === 'COMPLETED').length,
  }), [appointments])

  const visibleAppointments = useMemo(() => filter === 'ALL'
    ? appointments
    : appointments.filter(item => item.status === filter), [appointments, filter])

  const examDirty = useMemo(() => Object.entries(exam).some(([key, value]) => key !== 'quantity' && value.trim()), [exam])

  const selectAppointment = (appointment: Appointment) => {
    if (selected?.id !== appointment.id && selected?.status === 'IN_EXAMINATION' && examDirty) {
      setError('Form pemeriksaan belum disimpan. Simpan pemeriksaan atau kosongkan form sebelum berpindah pasien.')
      return
    }
    if (selected?.id !== appointment.id) setExam(initialExam)
    setSelected(appointment)
    setError('')
  }

  const start = async (appointment: Appointment) => {
    if (selected?.id !== appointment.id && selected?.status === 'IN_EXAMINATION' && examDirty) {
      setError('Form pemeriksaan belum disimpan. Simpan pemeriksaan atau kosongkan form sebelum memulai pasien lain.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await api.patch<{ appointment: Appointment }>(`/doctor/appointments/${appointment.id}/start`)
      if (selected?.id !== appointment.id) setExam(initialExam)
      setSelected(data.appointment)
      setAppointments(current => current.map(item => item.id === data.appointment.id ? data.appointment : item))
      setNotice(`Pemeriksaan ${data.appointment.queueCode} dimulai.`)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  const submitExamination = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected) return
    if (exam.medicineName && !exam.dosage) return setError('Isi dosis obat atau kosongkan nama obat.')
    setSaving(true)
    setError('')
    try {
      await api.post(`/doctor/appointments/${selected.id}/examination`, {
        subjective: exam.subjective,
        objective: exam.objective,
        assessment: exam.assessment,
        plan: exam.plan,
        diagnosis: exam.diagnosis,
        treatment: exam.treatment,
        notes: exam.notes,
        prescriptionItems: exam.medicineName ? [{
          medicineName: exam.medicineName,
          quantity: Number(exam.quantity),
          dosage: exam.dosage,
          instruction: exam.instruction,
        }] : [],
      })
      setNotice(`Pemeriksaan ${selected.queueCode} selesai dan tersimpan.`)
      setSelected(null)
      setExam(initialExam)
      await loadAppointments()
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  const updateExam = (key: keyof typeof exam, value: string) => setExam(current => ({ ...current, [key]: value }))

  return <div className="doctor-portal">
    <header className="doctor-header"><div className="brand"><img className="brand-logo" src="/Group%201.png" alt="" /><span className="brand-copy">Anahita Hospital<small>Portal Dokter</small></span></div><div><span>{session.user.name}</span><button className="text-button session-action" onClick={onLogout}><LogOut size={16} /> Keluar</button></div></header>
    <main className="doctor-shell">
      <section className="doctor-welcome"><div><span className="section-kicker">PORTAL DOKTER</span><h1>Antrean & Pemeriksaan</h1><p>Kelola pasien hari ini dan simpan catatan klinis secara terstruktur.</p></div><button className="button secondary" onClick={() => { setLoading(true); setError(''); void loadAppointments() }} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Muat ulang</button></section>
      {notice && <div className="alert success-alert" role="status">{notice}</div>}
      {error && <div className="alert error-alert" role="alert">{error}</div>}
      <section className="metric-grid"><article><span className="metric-icon waiting"><Clock3 size={19} /></span><div><span>Menunggu</span><strong>{metrics.waiting}</strong></div></article><article><span className="metric-icon examining"><PlayCircle size={19} /></span><div><span>Sedang diperiksa</span><strong>{metrics.examining}</strong></div></article><article><span className="metric-icon completed"><CheckCircle2 size={19} /></span><div><span>Selesai</span><strong>{metrics.completed}</strong></div></article></section>
      <div className="doctor-dashboard-grid"><section className="queue-panel"><div className="panel-heading"><h2>Daftar antrean</h2><span>{visibleAppointments.length} kunjungan</span></div><div className="queue-filters" aria-label="Filter status antrean">{([['ALL', 'Semua'], ['WAITING', 'Menunggu'], ['IN_EXAMINATION', 'Diperiksa'], ['COMPLETED', 'Selesai']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>{loading && <div className="loading-panel compact"><span className="spinner" /><p>Memuat antrean...</p></div>}{!loading && !visibleAppointments.length && <div className="queue-empty"><Users size={25} /><p>Belum ada antrean pada status ini.</p></div>}<div className="doctor-queue-list">{visibleAppointments.map(appointment => <article key={appointment.id} className={selected?.id === appointment.id ? 'selected' : ''}><button className="queue-select" onClick={() => selectAppointment(appointment)}><strong>{appointment.queueCode}</strong><span>{appointment.patient.user.name}</span><small>{formatDate(appointment.visitDate)} · {formatTime(appointment.schedule.startTime)} WIB</small><em className={`status ${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</em></button>{appointment.status === 'WAITING' && <button className="button primary small start-button" disabled={saving} onClick={() => void start(appointment)} aria-label={`Mulai pemeriksaan ${appointment.queueCode}`}><PlayCircle size={15} /> Mulai</button>}</article>)}</div></section>
        <section className="exam-panel">{!selected && <div className="empty-panel exam-empty"><span><ClipboardPlus size={30} /></span><h2>Pilih pasien</h2><p>Pilih antrean untuk melihat keluhan dan memulai pemeriksaan.</p></div>}{selected && <><div className="panel-heading"><div><span className="section-kicker">{selected.queueCode}</span><h2>{selected.patient.user.name}</h2></div><span className={`status ${selected.status.toLowerCase()}`}>{statusLabels[selected.status]}</span></div><div className="patient-summary"><span>Rekam medis<strong>{selected.patient.medicalRecordNumber}</strong></span><span>Poli<strong>{selected.doctor.specialty.name}</strong></span><span>Keluhan<strong>{selected.complaint}</strong></span></div>{selected.status === 'IN_EXAMINATION' && <form onSubmit={submitExamination}><div className="form-section-heading"><div><h3>Catatan SOAP</h3><p>Isi seluruh bagian berdasarkan hasil pemeriksaan pasien.</p></div>{examDirty && <button type="button" className="text-button reset-form" onClick={() => { setExam(initialExam); setError('') }}><RotateCcw size={15} /> Kosongkan form</button>}</div><div className="form-grid"><Field label="Subjective"><textarea required minLength={3} placeholder="Keluhan dan riwayat dari pasien" value={exam.subjective} onChange={event => updateExam('subjective', event.target.value)} /></Field><Field label="Objective"><textarea required minLength={3} placeholder="Temuan pemeriksaan objektif" value={exam.objective} onChange={event => updateExam('objective', event.target.value)} /></Field><Field label="Assessment"><textarea required minLength={3} placeholder="Penilaian kondisi pasien" value={exam.assessment} onChange={event => updateExam('assessment', event.target.value)} /></Field><Field label="Plan"><textarea required minLength={3} placeholder="Rencana tindak lanjut" value={exam.plan} onChange={event => updateExam('plan', event.target.value)} /></Field></div><Field label="Diagnosis"><textarea required minLength={3} placeholder="Diagnosis utama pasien" value={exam.diagnosis} onChange={event => updateExam('diagnosis', event.target.value)} /></Field><div className="form-grid"><Field label="Tindakan (opsional)"><input value={exam.treatment} onChange={event => updateExam('treatment', event.target.value)} /></Field><Field label="Catatan (opsional)"><input value={exam.notes} onChange={event => updateExam('notes', event.target.value)} /></Field></div><h3>Resep opsional</h3><div className="prescription-grid"><Field label="Nama obat"><input value={exam.medicineName} onChange={event => updateExam('medicineName', event.target.value)} /></Field><Field label="Jumlah"><input type="number" min="1" max="999" value={exam.quantity} onChange={event => updateExam('quantity', event.target.value)} /></Field><Field label="Dosis"><input placeholder="3 × 1 tablet" value={exam.dosage} onChange={event => updateExam('dosage', event.target.value)} /></Field><Field label="Instruksi"><input placeholder="Sesudah makan" value={exam.instruction} onChange={event => updateExam('instruction', event.target.value)} /></Field></div><button className="button primary full" disabled={saving}>{saving ? <><span className="button-spinner" /> Menyimpan...</> : 'Simpan & Selesaikan Pemeriksaan'}</button></form>}{selected.status === 'WAITING' && <div className="empty-panel compact"><p>Klik tombol <b>Mulai</b> pada antrean untuk membuka formulir SOAP.</p></div>}{selected.status === 'COMPLETED' && <div className="empty-panel compact"><CheckCircle2 size={25} /><p>Pemeriksaan ini sudah selesai dan dapat dilihat pada riwayat pasien.</p></div>}</>}</section>
      </div>
    </main>
  </div>
}
