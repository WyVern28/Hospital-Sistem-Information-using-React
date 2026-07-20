import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Clock3, RefreshCw, Search, Stethoscope, X } from 'lucide-react'
import Field from '../../../shared/components/ui/Field'
import { api, apiErrorMessage } from '../../../services/api'
import type { Appointment, AppointmentForm, Doctor } from '../../../types'
import { dayLabels, formatDate, formatTime, statusLabels, todayInJakarta } from '../../../utils/format'

export function RegistrationPage({ onDone }: { onDone: (message: string) => void }) {
  const [step, setStep] = useState(1)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState<number | ''>('')
  const [form, setForm] = useState<AppointmentForm>({ scheduleId: '', visitDate: '', complaint: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadDoctors = useCallback(() => {
    setLoading(true)
    setError('')
    api.get<{ doctors: Doctor[] }>('/doctors')
      .then(({ data }) => setDoctors(data.doctors))
      .catch(reason => setError(apiErrorMessage(reason)))
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

  const selectedDoctor = doctors.find(doctor => doctor.id === doctorId)
  const selectedSchedule = selectedDoctor?.schedules.find(schedule => schedule.id === form.scheduleId)
  const update = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => setForm(current => ({ ...current, [key]: value }))

  const continueTo = (next: number) => {
    setError('')
    if (step === 1 && (!doctorId || !form.scheduleId || !form.visitDate)) {
      setError('Pilih dokter, jadwal praktik, dan tanggal kunjungan terlebih dahulu.')
      return
    }
    if (step === 1 && selectedSchedule && form.visitDate) {
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      const selectedDay = days[new Date(`${form.visitDate}T00:00:00.000Z`).getUTCDay()]
      if (selectedDay !== selectedSchedule.day) {
        setError(`Tanggal yang dipilih bukan hari ${dayLabels[selectedSchedule.day]}. Pilih tanggal yang sesuai jadwal praktik.`)
        return
      }
    }
    if (step === 2 && form.complaint.trim().length < 5) {
      setError('Jelaskan keluhan minimal 5 karakter.')
      return
    }
    setStep(next)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.scheduleId) return
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post<{ appointment: Appointment }>('/appointments', form)
      onDone(`Pendaftaran berhasil. Nomor antrean Anda ${data.appointment.queueCode}.`)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="section registration-page">
    <div className="form-heading"><span className="section-kicker">PENDAFTARAN ONLINE</span><h1>Daftar Kunjungan</h1><p>Pilih jadwal yang aktif dan jelaskan keluhan agar dokter dapat mempersiapkan pemeriksaan.</p></div>
    <div className="stepper" aria-label={`Langkah ${step} dari 3`}>{['Pilih Jadwal', 'Keluhan', 'Konfirmasi'].map((label, index) => <button type="button" aria-label={`Langkah ${index + 1}: ${label}`} onClick={() => index + 1 < step && setStep(index + 1)} disabled={index + 1 > step} aria-current={step === index + 1 ? 'step' : undefined} key={label} className={step >= index + 1 ? 'stepper-item current' : 'stepper-item'}><b>{step > index + 1 ? <CheckCircle2 size={18} /> : index + 1}</b><span>{label}</span></button>)}</div>
    <div className="form-layout"><form className="form-card" onSubmit={submit}>
      {error && <div className="alert error-alert" role="alert">{error}</div>}
      {loading && <div className="loading-panel compact"><span className="spinner" /><p>Memuat jadwal dokter...</p></div>}
      {!loading && error && !doctors.length && <button type="button" className="button secondary" onClick={loadDoctors}><RefreshCw size={16} /> Coba lagi</button>}
      {!loading && step === 1 && <><h2>Pilih dokter dan jadwal</h2><div className="form-grid">
        <Field label="Dokter"><select required value={doctorId} onChange={event => { setDoctorId(Number(event.target.value) || ''); update('scheduleId', '') }}><option value="">Pilih dokter</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.user.name} — {doctor.specialty.name}</option>)}</select></Field>
        <Field label="Jadwal praktik"><select required value={form.scheduleId} disabled={!selectedDoctor} onChange={event => update('scheduleId', Number(event.target.value) || '')}><option value="">Pilih jadwal</option>{selectedDoctor?.schedules.map(schedule => <option key={schedule.id} value={schedule.id}>{dayLabels[schedule.day]}, {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)} WIB</option>)}</select></Field>
        <Field label="Tanggal kunjungan"><input required type="date" min={todayInJakarta()} value={form.visitDate} onChange={event => update('visitDate', event.target.value)} /></Field>
      </div><button type="button" className="button primary" onClick={() => continueTo(2)}>Lanjutkan →</button></>}
      {step === 2 && <><h2>Keluhan pasien</h2><Field label="Keluhan utama"><textarea required minLength={5} maxLength={2000} value={form.complaint} onChange={event => update('complaint', event.target.value)} placeholder="Contoh: demam dan batuk sejak tiga hari terakhir..." /></Field><div className="field-hint"><span>Jelaskan gejala utama dan sejak kapan dirasakan.</span><span>{form.complaint.length}/2000</span></div><div className="button-row"><button type="button" className="button secondary" onClick={() => setStep(1)}>Kembali</button><button type="button" className="button primary" onClick={() => continueTo(3)}>Tinjau Data →</button></div></>}
      {step === 3 && <><h2>Konfirmasi pendaftaran</h2><div className="summary"><span><Stethoscope size={17} />Dokter<strong>{selectedDoctor?.user.name ?? '—'}</strong></span><span><ClipboardList size={17} />Poli<strong>{selectedDoctor?.specialty.name ?? '—'}</strong></span><span><Clock3 size={17} />Jadwal<strong>{selectedSchedule ? `${dayLabels[selectedSchedule.day]}, ${formatTime(selectedSchedule.startTime)} WIB` : '—'}</strong></span><span><CalendarDays size={17} />Tanggal<strong>{form.visitDate ? formatDate(`${form.visitDate}T00:00:00.000Z`) : '—'}</strong></span></div><p className="complaint-preview"><b>Keluhan:</b> {form.complaint}</p><div className="button-row"><button type="button" className="button secondary" onClick={() => setStep(2)}>Kembali</button><button className="button primary" disabled={submitting}>{submitting ? <><span className="button-spinner" /> Menyimpan...</> : 'Konfirmasi Pendaftaran'}</button></div></>}
    </form><aside className="side-note"><span className="side-note-icon"><CalendarDays size={22} /></span><h3>Informasi penting</h3><p>Tanggal harus sesuai dengan hari praktik yang dipilih. Sistem akan menolak jadwal lampau, jadwal penuh, dan pendaftaran ganda.</p><hr /><p>Datang 15 menit lebih awal dengan membawa identitas pasien.</p></aside></div>
  </main>
}

type QueueResult = {
  queueCode: string
  status: Appointment['status']
  visitDate: string
  clinic: string
  doctor: string
  startTime: string
  patientsAhead: number
}

export function QueuePage() {
  const [number, setNumber] = useState('')
  const [result, setResult] = useState<QueueResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (!number.trim()) return setError('Masukkan nomor antrean terlebih dahulu.')
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.get<{ queue: QueueResult }>(`/queue/${encodeURIComponent(number.trim())}`)
      setResult(data.queue)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  return <main className="section queue-page"><div className="form-heading"><span className="queue-heading-icon"><Search size={25} /></span><span className="section-kicker">ANTREAN DIGITAL</span><h1>Cek Antrean Anda</h1><p>Masukkan kode antrean untuk melihat status terkini tanpa menampilkan data pribadi.</p></div>
    <form className="queue-search" onSubmit={search}><label className="sr-only" htmlFor="queue-code">Nomor antrean</label><input id="queue-code" maxLength={24} autoComplete="off" value={number} onChange={event => { setNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setError('') }} placeholder="Contoh: PD-SEN-001" /><button className="button primary" disabled={loading}>{loading ? <><span className="button-spinner" /> Mengecek...</> : 'Cek Antrean'}</button></form>
    {error && <div className="alert error-alert" role="alert">{error}</div>}
    {result && <article className="queue-result" aria-live="polite"><div><span>Status antrean</span><h2>{statusLabels[result.status]}</h2><p>{result.clinic}</p></div><div className="queue-number"><small>Nomor Anda</small><strong>{result.queueCode}</strong></div><div><span>Jadwal</span><h3>{formatTime(result.startTime)} WIB</h3><p>{result.patientsAhead} pasien sebelum Anda · {formatDate(result.visitDate)}</p></div></article>}
  </main>
}

export function HistoryPage({ onRegister }: { onRegister: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<{ appointments: Appointment[] }>('/appointments/my')
      setAppointments(data.appointments)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    api.get<{ appointments: Appointment[] }>('/appointments/my', { signal: controller.signal })
      .then(({ data }) => setAppointments(data.appointments))
      .catch(reason => { if (reason.code !== 'ERR_CANCELED') setError(apiErrorMessage(reason)) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const cancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setError('')
    try {
      await api.delete(`/appointments/${cancelTarget.id}`)
      setCancelTarget(null)
      await load()
    } catch (reason) {
      setError(apiErrorMessage(reason))
      setCancelTarget(null)
    } finally {
      setCancelling(false)
    }
  }

  return <main className="section"><div className="section-header"><div><span className="section-kicker">AKUN PASIEN</span><h1>Riwayat Pendaftaran</h1><p>Status kunjungan dan hasil pemeriksaan tersimpan di akun Anda.</p></div><button className="button primary" onClick={onRegister}>+ Daftar Kunjungan</button></div>
    {error && <div className="alert error-alert" role="alert">{error}</div>}
    {loading && <div className="loading-panel"><span className="spinner" /><p>Memuat riwayat kunjungan...</p></div>}
    {!loading && error && <div className="retry-row"><button className="button secondary" onClick={() => void load()}><RefreshCw size={16} /> Coba lagi</button></div>}
    {!loading && !appointments.length && <div className="empty-panel"><h2>Belum ada kunjungan</h2><p>Buat pendaftaran pertama Anda untuk memperoleh nomor antrean.</p><button className="button primary" onClick={onRegister}>Daftar sekarang</button></div>}
    <div className="history-list">{appointments.map(appointment => {
      const date = new Date(appointment.visitDate)
      return <article key={appointment.id} className="history-card"><div className="visit-date"><b>{String(date.getUTCDate()).padStart(2, '0')}</b><span>{date.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</span></div><div><span className={`status ${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span><h3>{appointment.doctor.specialty.name}</h3><p>{appointment.doctor.user.name} · {formatTime(appointment.schedule.startTime)} WIB</p></div><strong className="visit-queue">{appointment.queueCode}</strong><div className="visit-actions">{appointment.medicalRecord && <button className="link-button" onClick={() => setDetailId(detailId === appointment.id ? null : appointment.id)}>Hasil pemeriksaan</button>}{appointment.status === 'WAITING' && <button className="link-button danger" onClick={() => setCancelTarget(appointment)}>Batalkan</button>}</div>{detailId === appointment.id && appointment.medicalRecord && <MedicalRecordDetail appointment={appointment} />}</article>
    })}</div>
    {cancelTarget && <CancelModal queueCode={cancelTarget.queueCode} busy={cancelling} onClose={() => setCancelTarget(null)} onConfirm={cancel} />}
  </main>
}

function MedicalRecordDetail({ appointment }: { appointment: Appointment }) {
  const record = appointment.medicalRecord
  const items = useMemo(() => record?.prescription?.items ?? [], [record])
  if (!record) return null
  return <section className="medical-record-detail"><h4>Ringkasan hasil pemeriksaan</h4><dl><div><dt>Diagnosis</dt><dd>{record.diagnosis}</dd></div><div><dt>Subjective</dt><dd>{record.subjective}</dd></div><div><dt>Objective</dt><dd>{record.objective}</dd></div><div><dt>Assessment</dt><dd>{record.assessment}</dd></div><div><dt>Plan</dt><dd>{record.plan}</dd></div></dl>{items.length > 0 && <><h4>Resep</h4><ul>{items.map(item => <li key={item.id}>{item.medicineName} — {item.dosage}, jumlah {item.quantity}{item.instruction ? ` (${item.instruction})` : ''}</li>)}</ul></>}</section>
}

function CancelModal({ queueCode, busy, onClose, onConfirm }: { queueCode: string; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [busy, onClose])

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}><section className="cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button className="modal-close" aria-label="Tutup dialog" disabled={busy} onClick={onClose}><X size={19} /></button><div className="modal-icon" aria-hidden="true"><AlertTriangle size={28} /></div><h2 id="cancel-title">Batalkan Pendaftaran?</h2><p>Nomor antrean <b>{queueCode}</b> akan dibatalkan dan tidak dapat dipulihkan.</p><div className="modal-actions"><button className="button primary danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Membatalkan...' : 'Ya, Batalkan Pendaftaran'}</button><button className="button secondary" disabled={busy} onClick={onClose}>Tidak, Pertahankan Jadwal</button></div></section></div>
}
