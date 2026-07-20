import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import { apiErrorMessage } from '../../../services/api'
import type { AppointmentStatus, AuthSession, UserRole } from '../../../types'
import { dayLabels, formatDate, formatTime, statusLabels, todayInJakarta } from '../../../utils/format'
import { adminService } from '../services/admin.service'
import type {
  AdminAppointment,
  AdminAuditLog,
  AdminDashboardData,
  AdminDay,
  AdminDoctor,
  AdminReport,
  AdminSchedule,
  AdminSetting,
  AdminSpecialty,
  AdminUser,
} from '../types/admin'
import './AdminPortal.css'

type AdminTab = 'overview' | 'appointments' | 'doctors' | 'users' | 'reports' | 'audit' | 'settings'

const roleLabels: Record<UserRole, string> = { ADMIN: 'Admin', DOCTOR: 'Dokter', PATIENT: 'Pasien' }
const statusOptions: AppointmentStatus[] = ['WAITING', 'IN_EXAMINATION', 'COMPLETED', 'CANCELLED']
const dayOptions: AdminDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function dayLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`))
}

function userInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function previousDate(days: number) {
  const date = new Date(`${todayInJakarta()}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function editableStatuses(status: AppointmentStatus): AppointmentStatus[] {
  const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    WAITING: ['WAITING', 'IN_EXAMINATION', 'CANCELLED'],
    IN_EXAMINATION: ['IN_EXAMINATION', 'CANCELLED'],
    COMPLETED: ['COMPLETED'],
    CANCELLED: ['CANCELLED', 'WAITING'],
  }
  return transitions[status]
}

export default function AdminPortal({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([])
  const [settings, setSettings] = useState<AdminSetting[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [report, setReport] = useState<AdminReport | null>(null)
  const [reportFrom, setReportFrom] = useState(() => previousDate(29))
  const [reportTo, setReportTo] = useState(() => todayInJakarta())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')

  const runLoad = useCallback(async (task: () => Promise<void>) => {
    setLoading(true)
    setError('')
    try {
      await task()
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDashboard = useCallback(() => runLoad(async () => setDashboard(await adminService.dashboard())), [runLoad])
  const loadAppointments = useCallback(() => runLoad(async () => setAppointments(await adminService.appointments())), [runLoad])
  const loadUsers = useCallback(() => runLoad(async () => {
    const [nextUsers, nextSpecialties] = await Promise.all([adminService.users(), adminService.specialties()])
    setUsers(nextUsers)
    setSpecialties(nextSpecialties)
  }), [runLoad])
  const loadDoctors = useCallback(() => runLoad(async () => {
    const [nextDoctors, nextSpecialties] = await Promise.all([adminService.doctors(), adminService.specialties()])
    setDoctors(nextDoctors)
    setSpecialties(nextSpecialties)
  }), [runLoad])
  const loadSettings = useCallback(() => runLoad(async () => setSettings(await adminService.settings())), [runLoad])
  const loadAudit = useCallback(() => runLoad(async () => setAuditLogs(await adminService.auditLogs())), [runLoad])
  const loadReport = useCallback(() => runLoad(async () => setReport(await adminService.report(reportFrom, reportTo))), [reportFrom, reportTo, runLoad])

  useEffect(() => {
    document.title = 'Panel Admin | Anahita Hospital'
    let active = true
    adminService.dashboard()
      .then(data => { if (active) setDashboard(data) })
      .catch(reason => { if (active) setError(apiErrorMessage(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const openTab = (next: AdminTab) => {
    setTab(next)
    setMenuOpen(false)
    setSearch('')
    setError('')
    if (next === 'overview') void loadDashboard()
    if (next === 'appointments') void loadAppointments()
    if (next === 'doctors') void loadDoctors()
    if (next === 'users') void loadUsers()
    if (next === 'reports') void loadReport()
    if (next === 'audit') void loadAudit()
    if (next === 'settings') void loadSettings()
  }

  const refresh = () => {
    if (tab === 'overview') void loadDashboard()
    if (tab === 'appointments') void loadAppointments()
    if (tab === 'doctors') void loadDoctors()
    if (tab === 'users') void loadUsers()
    if (tab === 'reports') void loadReport()
    if (tab === 'audit') void loadAudit()
    if (tab === 'settings') void loadSettings()
  }

  const visibleAppointments = useMemo(() => {
    const term = search.trim().toLowerCase()
    return appointments.filter(item => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      const haystack = `${item.queueCode} ${item.patient.user.name} ${item.doctor.user.name} ${item.doctor.specialty.name}`.toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [appointments, search, statusFilter])

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter(user => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      return matchesRole && (!term || `${user.name} ${user.email}`.toLowerCase().includes(term))
    })
  }, [roleFilter, search, users])

  const visibleDoctors = useMemo(() => {
    const term = search.trim().toLowerCase()
    return doctors.filter(doctor => !term || `${doctor.user.name} ${doctor.specialty.name} ${doctor.licenseNumber}`.toLowerCase().includes(term))
  }, [doctors, search])

  const visibleAudit = useMemo(() => {
    const term = search.trim().toLowerCase()
    return auditLogs.filter(log => !term || `${log.user?.name ?? ''} ${log.action} ${log.entity} ${log.description}`.toLowerCase().includes(term))
  }, [auditLogs, search])

  const changeAppointmentStatus = async (appointment: AdminAppointment, status: AppointmentStatus) => {
    setBusyId(appointment.id)
    setError('')
    try {
      const updated = await adminService.updateAppointmentStatus(appointment.id, status)
      setAppointments(current => current.map(item => item.id === appointment.id ? updated : item))
      setNotice(`Status ${appointment.queueCode} diperbarui menjadi ${statusLabels[status].toLowerCase()}.`)
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusyId(null) }
  }

  const toggleUser = async (user: AdminUser) => {
    setBusyId(user.id)
    setError('')
    try {
      const isActive = !user.isActive
      await adminService.updateUserStatus(user.id, isActive)
      setUsers(current => current.map(item => item.id === user.id ? { ...item, isActive } : item))
      setNotice(`Akun ${user.name} ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`)
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusyId(null) }
  }

  const changeUserRole = async (user: AdminUser, role: UserRole) => {
    setBusyId(user.id)
    setError('')
    try {
      const updated = await adminService.updateUserRole(user.id, role)
      setUsers(current => current.map(item => item.id === user.id ? updated : item))
      setNotice(`Role ${user.name} diperbarui menjadi ${roleLabels[role]}.`)
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusyId(null) }
  }

  const createUser = async (payload: Parameters<typeof adminService.createUser>[0]) => {
    setError('')
    try {
      const created = await adminService.createUser(payload)
      setUsers(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNotice(`Akun ${created.name} berhasil dibuat.`)
      return true
    } catch (reason) {
      setError(apiErrorMessage(reason))
      return false
    }
  }

  const updateDoctor = async (doctor: AdminDoctor, payload: Parameters<typeof adminService.updateDoctor>[1]) => {
    setBusyId(doctor.id)
    setError('')
    try {
      const updated = await adminService.updateDoctor(doctor.id, payload)
      setDoctors(current => current.map(item => item.id === doctor.id ? updated : item))
      setNotice(`Profil ${updated.user.name} diperbarui.`)
      return true
    } catch (reason) { setError(apiErrorMessage(reason)); return false } finally { setBusyId(null) }
  }

  const createSchedule = async (doctorId: number, payload: Parameters<typeof adminService.createSchedule>[1]) => {
    setBusyId(doctorId)
    setError('')
    try {
      const schedule = await adminService.createSchedule(doctorId, payload)
      setDoctors(current => current.map(doctor => doctor.id === doctorId ? { ...doctor, schedules: [...doctor.schedules, schedule] } : doctor))
      setNotice(`Jadwal ${schedule.code} berhasil ditambahkan.`)
      return true
    } catch (reason) { setError(apiErrorMessage(reason)); return false } finally { setBusyId(null) }
  }

  const updateSchedule = async (doctorId: number, schedule: AdminSchedule, payload: Parameters<typeof adminService.updateSchedule>[1]) => {
    setBusyId(schedule.id)
    setError('')
    try {
      const updated = await adminService.updateSchedule(schedule.id, payload)
      setDoctors(current => current.map(doctor => doctor.id === doctorId ? { ...doctor, schedules: doctor.schedules.map(item => item.id === schedule.id ? updated : item) } : doctor))
      setNotice(`Jadwal ${schedule.code} diperbarui.`)
      return true
    } catch (reason) { setError(apiErrorMessage(reason)); return false } finally { setBusyId(null) }
  }

  const saveSetting = async (setting: AdminSetting, value: string) => {
    setBusyId(setting.id)
    setError('')
    try {
      const updated = await adminService.updateSetting(setting.key, value)
      setSettings(current => current.map(item => item.id === setting.id ? updated : item))
      setNotice(`${setting.label} berhasil disimpan.`)
    } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusyId(null) }
  }

  return <div className="admin-portal">
    {menuOpen && <button className="admin-overlay" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
    <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="admin-brand"><span className="admin-brand-mark">+</span><span>Anahita Hospital<small>Panel Administrasi</small></span></div>
      <button className="admin-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
      <nav aria-label="Menu admin">
        <span className="admin-nav-label">MENU UTAMA</span>
        <NavButton tab="overview" active={tab} icon={<LayoutDashboard size={19} />} label="Ringkasan" onOpen={openTab} />
        <NavButton tab="appointments" active={tab} icon={<CalendarDays size={19} />} label="Kunjungan" onOpen={openTab} />
        <NavButton tab="doctors" active={tab} icon={<Stethoscope size={19} />} label="Dokter & Jadwal" onOpen={openTab} />
        <NavButton tab="users" active={tab} icon={<UsersRound size={19} />} label="Pengguna & Role" onOpen={openTab} />
        <NavButton tab="reports" active={tab} icon={<FileBarChart size={19} />} label="Laporan" onOpen={openTab} />
        <span className="admin-nav-label secondary">SISTEM</span>
        <NavButton tab="audit" active={tab} icon={<ListChecks size={19} />} label="Audit Log" onOpen={openTab} />
        <NavButton tab="settings" active={tab} icon={<Settings size={19} />} label="Konfigurasi" onOpen={openTab} />
      </nav>
      <div className="admin-sidebar-note"><ShieldCheck size={20} /><div><strong>Akses terlindungi</strong><span>Perubahan penting tercatat di audit log.</span></div></div>
      <div className="admin-profile"><span>{userInitials(session.user.name)}</span><div><strong>{session.user.name}</strong><small>Administrator</small></div><button onClick={onLogout} aria-label="Keluar dari panel admin"><LogOut size={18} /></button></div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar"><button className="admin-menu" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div><span>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span><strong>Selamat bertugas, {session.user.name.split(' ')[0]}</strong></div><button className="admin-refresh" disabled={loading} onClick={refresh}><RefreshCw size={17} className={loading ? 'spin' : ''} /><span>Segarkan data</span></button></header>
      <main className="admin-content">
        {notice && <div className="admin-notice" role="status"><ShieldCheck size={17} />{notice}</div>}
        {error && <div className="admin-error" role="alert"><span>{error}</span><button onClick={refresh}>Coba lagi</button></div>}
        {tab === 'overview' && <Overview dashboard={dashboard} loading={loading} onOpenAppointments={() => openTab('appointments')} />}
        {tab === 'appointments' && <AppointmentsPanel appointments={visibleAppointments} loading={loading} search={search} onSearch={setSearch} filter={statusFilter} onFilter={setStatusFilter} busyId={busyId} onStatusChange={changeAppointmentStatus} />}
        {tab === 'doctors' && <DoctorsPanel doctors={visibleDoctors} specialties={specialties} loading={loading} search={search} onSearch={setSearch} busyId={busyId} onUpdateDoctor={updateDoctor} onCreateSchedule={createSchedule} onUpdateSchedule={updateSchedule} />}
        {tab === 'users' && <UsersPanel users={visibleUsers} specialties={specialties} loading={loading} search={search} onSearch={setSearch} filter={roleFilter} onFilter={setRoleFilter} busyId={busyId} currentUserId={session.user.id} onToggle={toggleUser} onRoleChange={changeUserRole} onCreate={createUser} />}
        {tab === 'reports' && <ReportsPanel report={report} loading={loading} from={reportFrom} to={reportTo} onFrom={setReportFrom} onTo={setReportTo} onLoad={() => void loadReport()} />}
        {tab === 'audit' && <AuditPanel logs={visibleAudit} loading={loading} search={search} onSearch={setSearch} />}
        {tab === 'settings' && <SettingsPanel settings={settings} loading={loading} busyId={busyId} onSave={saveSetting} />}
      </main>
    </div>
  </div>
}

function NavButton({ tab, active, icon, label, onOpen }: { tab: AdminTab; active: AdminTab; icon: ReactNode; label: string; onOpen: (tab: AdminTab) => void }) {
  return <button className={active === tab ? 'active' : ''} onClick={() => onOpen(tab)}>{icon}<span>{label}</span></button>
}

function Overview({ dashboard, loading, onOpenAppointments }: { dashboard: AdminDashboardData | null; loading: boolean; onOpenAppointments: () => void }) {
  if (loading && !dashboard) return <AdminLoading label="Menyiapkan ringkasan rumah sakit..." />
  if (!dashboard) return null
  const maxTrend = Math.max(1, ...dashboard.trend.map(item => item.count))
  const statusTotal = dashboard.statusBreakdown.reduce((total, item) => total + item.count, 0)
  const progressMax = Math.max(1, statusTotal)
  const metrics = [
    { label: 'Kunjungan hari ini', value: dashboard.metrics.appointmentsToday, note: `${dashboard.metrics.waiting} masih menunggu`, icon: <Activity size={21} />, tone: 'emerald' },
    { label: 'Pasien terdaftar', value: dashboard.metrics.patients, note: 'Rekam medis aktif', icon: <UsersRound size={21} />, tone: 'blue' },
    { label: 'Dokter aktif', value: dashboard.metrics.doctors, note: 'Siap melayani pasien', icon: <Stethoscope size={21} />, tone: 'violet' },
    { label: 'Pengguna aktif', value: dashboard.metrics.activeUsers, note: 'Seluruh peran sistem', icon: <ShieldCheck size={21} />, tone: 'amber' },
  ]

  return <>
    <PageHeading kicker="PUSAT KENDALI" title="Ringkasan Operasional" description="Pantau pelayanan, pengguna, dan kesiapan modul SIMRS dari satu tempat." action={<div className="admin-live"><i />Data {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(dashboard.generatedAt))}</div>} />
    <section className="admin-metrics">{metrics.map(metric => <article key={metric.label}><span className={`admin-metric-icon ${metric.tone}`}>{metric.icon}</span><div><p>{metric.label}</p><strong>{metric.value.toLocaleString('id-ID')}</strong><small>{metric.note}</small></div></article>)}</section>
    <section className="admin-overview-grid">
      <article className="admin-panel admin-trend"><div className="admin-panel-heading"><div><h2>Tren Kunjungan</h2><p>Kunjungan aktif dalam 7 hari terakhir</p></div><span>7 hari</span></div><div className="admin-chart">{dashboard.trend.map(item => <div className="admin-bar-column" key={item.date}><b>{item.count}</b><span><i style={{ height: `${Math.max(8, (item.count / maxTrend) * 100)}%` }} /></span><small>{dayLabel(item.date)}</small></div>)}</div></article>
      <article className="admin-panel admin-status"><div className="admin-panel-heading"><div><h2>Status Hari Ini</h2><p>Distribusi pelayanan pasien</p></div></div><div className="admin-status-list">{dashboard.statusBreakdown.map(item => <div key={item.status}><span><i className={`status-dot ${item.status.toLowerCase()}`} />{statusLabels[item.status]}<b>{item.count}</b></span><progress max={progressMax} value={item.count} /></div>)}</div><div className="admin-status-total"><Clock3 size={18} /><span>Total kunjungan hari ini<strong>{statusTotal}</strong></span></div></article>
    </section>
    <ModuleRoadmap />
    <section className="admin-panel admin-recent"><div className="admin-panel-heading"><div><h2>Antrean Hari Ini</h2><p>Kunjungan terbaru yang perlu dipantau</p></div><button onClick={onOpenAppointments}>Lihat semua <ChevronRight size={17} /></button></div>{!dashboard.recentAppointments.length ? <Empty icon={<CalendarDays size={28} />} text="Belum ada kunjungan untuk hari ini." /> : <div className="admin-appointment-list compact">{dashboard.recentAppointments.map(item => <AppointmentRow appointment={item} key={item.id} />)}</div>}</section>
  </>
}

function ModuleRoadmap() {
  const modules = [
    ['Pendaftaran & Antrean', 'Aktif', 'active'],
    ['RME & E-Resep', 'Aktif', 'active'],
    ['Admin & Jadwal', 'Sprint 2', 'current'],
    ['Farmasi & Stok', 'Release 3', 'planned'],
    ['Kasir & Tagihan', 'Release 3', 'planned'],
    ['Laporan Lengkap', 'Release 4', 'planned'],
  ]
  return <section className="admin-panel admin-roadmap"><div className="admin-panel-heading"><div><h2>Kesiapan Modul SIMRS</h2><p>Status implementasi mengikuti Product Backlog dan urutan release laporan Scrum.</p></div></div><div className="admin-module-grid">{modules.map(([name, stage, tone]) => <article key={name}><i className={tone} /><div><strong>{name}</strong><small>{stage}</small></div></article>)}</div></section>
}

function AppointmentsPanel({ appointments, loading, search, onSearch, filter, onFilter, busyId, onStatusChange }: { appointments: AdminAppointment[]; loading: boolean; search: string; onSearch: (value: string) => void; filter: 'ALL' | AppointmentStatus; onFilter: (value: 'ALL' | AppointmentStatus) => void; busyId: number | null; onStatusChange: (appointment: AdminAppointment, status: AppointmentStatus) => void }) {
  return <><PageHeading kicker="PELAYANAN PASIEN" title="Manajemen Kunjungan" description="Cari antrean, periksa jadwal, dan perbarui status pelayanan." /><section className="admin-panel admin-management"><Toolbar search={search} onSearch={onSearch} placeholder="Cari pasien, dokter, poli, atau kode antrean..." extra={<select value={filter} onChange={event => onFilter(event.target.value as 'ALL' | AppointmentStatus)} aria-label="Filter status"><option value="ALL">Semua status</option>{statusOptions.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>} /><div className="admin-list-heading"><span>{appointments.length} kunjungan ditemukan</span><span>Status pelayanan</span></div>{loading ? <AdminLoading label="Memuat data kunjungan..." /> : !appointments.length ? <Empty title="Kunjungan tidak ditemukan" text="Ubah kata pencarian atau filter status." /> : <div className="admin-appointment-list">{appointments.map(item => <AppointmentRow appointment={item} key={item.id} action={<select disabled={busyId === item.id || editableStatuses(item.status).length === 1} value={item.status} onChange={event => onStatusChange(item, event.target.value as AppointmentStatus)} aria-label={`Ubah status ${item.queueCode}`}>{editableStatuses(item.status).map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>} />)}</div>}</section></>
}

function AppointmentRow({ appointment, action }: { appointment: AdminAppointment; action?: ReactNode }) {
  return <article className="admin-appointment-row"><div className="admin-queue-code"><strong>{appointment.queueCode}</strong><span className={`status ${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span></div><div className="admin-patient-cell"><span className="admin-avatar">{userInitials(appointment.patient.user.name)}</span><div><strong>{appointment.patient.user.name}</strong><small>{appointment.patient.medicalRecordNumber}</small></div></div><div className="admin-doctor-cell"><strong>{appointment.doctor.specialty.name}</strong><small>{appointment.doctor.user.name}</small></div><div className="admin-time-cell"><strong>{formatDate(appointment.visitDate)}</strong><small>{formatTime(appointment.schedule.startTime)}–{formatTime(appointment.schedule.endTime)} WIB</small></div>{action && <div className="admin-row-action">{action}</div>}</article>
}

function UsersPanel({ users, specialties, loading, search, onSearch, filter, onFilter, busyId, currentUserId, onToggle, onRoleChange, onCreate }: { users: AdminUser[]; specialties: AdminSpecialty[]; loading: boolean; search: string; onSearch: (value: string) => void; filter: 'ALL' | UserRole; onFilter: (value: 'ALL' | UserRole) => void; busyId: number | null; currentUserId: number; onToggle: (user: AdminUser) => void; onRoleChange: (user: AdminUser, role: UserRole) => void; onCreate: (payload: Parameters<typeof adminService.createUser>[0]) => Promise<boolean> }) {
  const [createOpen, setCreateOpen] = useState(false)
  return <><PageHeading kicker="AKSES SISTEM" title="Pengguna & Hak Akses" description="Kelola akun dan role berbasis RBAC sesuai kebutuhan operasional." action={<button className="admin-primary" onClick={() => setCreateOpen(true)}><UserPlus size={17} />Tambah pengguna</button>} /><section className="admin-panel admin-management"><Toolbar search={search} onSearch={onSearch} placeholder="Cari nama atau email pengguna..." extra={<select value={filter} onChange={event => onFilter(event.target.value as 'ALL' | UserRole)} aria-label="Filter peran"><option value="ALL">Semua peran</option><option value="PATIENT">Pasien</option><option value="DOCTOR">Dokter</option><option value="ADMIN">Admin</option></select>} /><div className="admin-list-heading"><span>{users.length} pengguna ditemukan</span><span>Role dan status akun</span></div>{loading ? <AdminLoading label="Memuat data pengguna..." /> : !users.length ? <Empty title="Pengguna tidak ditemukan" text="Ubah kata pencarian atau filter peran." /> : <div className="admin-user-list">{users.map(user => <article key={user.id} className="admin-user-row"><span className="admin-avatar large">{userInitials(user.name)}</span><div className="admin-user-identity"><strong>{user.name}</strong><small>{user.email}</small></div><select className={`admin-role-select ${user.role.toLowerCase()}`} value={user.role} disabled={busyId === user.id || user.id === currentUserId} onChange={event => onRoleChange(user, event.target.value as UserRole)} aria-label={`Role ${user.name}`}><option value="PATIENT">Pasien</option><option value="DOCTOR" disabled={!user.doctor}>Dokter</option><option value="ADMIN">Admin</option></select><div className="admin-user-detail"><strong>{user.doctor?.specialty.name ?? user.patient?.medicalRecordNumber ?? 'Akses administrator'}</strong><small>{user.lastLogin ? `Masuk terakhir ${formatDate(user.lastLogin)}` : 'Belum pernah masuk'}</small></div><label className="admin-switch"><input type="checkbox" checked={user.isActive} disabled={busyId === user.id || user.id === currentUserId} onChange={() => onToggle(user)} /><span /><em>{user.isActive ? 'Aktif' : 'Nonaktif'}</em></label></article>)}</div>}</section>{createOpen && <CreateUserModal specialties={specialties} onClose={() => setCreateOpen(false)} onCreate={onCreate} />}</>
}

function CreateUserModal({ specialties, onClose, onCreate }: { specialties: AdminSpecialty[]; onClose: () => void; onCreate: (payload: Parameters<typeof adminService.createUser>[0]) => Promise<boolean> }) {
  const [role, setRole] = useState<UserRole>('PATIENT')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const data = new FormData(event.currentTarget)
    const payload = {
      name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), phone: String(data.get('phone') ?? ''), password: String(data.get('password') ?? ''), role,
      nik: String(data.get('nik') ?? ''), specialtyId: role === 'DOCTOR' ? Number(data.get('specialtyId')) : undefined,
      licenseNumber: String(data.get('licenseNumber') ?? ''), experienceYears: role === 'DOCTOR' ? Number(data.get('experienceYears') ?? 0) : undefined, bio: String(data.get('bio') ?? ''),
    }
    const success = await onCreate(payload)
    setSubmitting(false)
    if (success) onClose()
  }
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><div className="admin-modal-head"><div><span className="admin-kicker">AKUN BARU</span><h2 id="create-user-title">Tambah Pengguna</h2></div><button onClick={onClose} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submit} className="admin-form-grid"><FormField label="Nama lengkap"><input name="name" minLength={3} required /></FormField><FormField label="Email"><input name="email" type="email" required /></FormField><FormField label="Nomor telepon"><input name="phone" inputMode="tel" /></FormField><FormField label="Kata sandi sementara"><input name="password" type="password" minLength={8} required /></FormField><FormField label="Role pengguna"><select value={role} onChange={event => setRole(event.target.value as UserRole)}><option value="PATIENT">Pasien</option><option value="DOCTOR">Dokter</option><option value="ADMIN">Admin</option></select></FormField>{role === 'PATIENT' && <FormField label="NIK (opsional)"><input name="nik" inputMode="numeric" minLength={16} maxLength={16} /></FormField>}{role === 'DOCTOR' && <><FormField label="Spesialisasi"><select name="specialtyId" required><option value="">Pilih spesialisasi</option>{specialties.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></FormField><FormField label="Nomor SIP"><input name="licenseNumber" required /></FormField><FormField label="Pengalaman (tahun)"><input name="experienceYears" type="number" min="0" max="70" defaultValue="0" required /></FormField><FormField label="Profil singkat" wide><textarea name="bio" rows={3} /></FormField></>}<div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={onClose}>Batal</button><button className="admin-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Buat akun'}</button></div></form></section></div>
}

function DoctorsPanel({ doctors, specialties, loading, search, onSearch, busyId, onUpdateDoctor, onCreateSchedule, onUpdateSchedule }: { doctors: AdminDoctor[]; specialties: AdminSpecialty[]; loading: boolean; search: string; onSearch: (value: string) => void; busyId: number | null; onUpdateDoctor: (doctor: AdminDoctor, payload: Parameters<typeof adminService.updateDoctor>[1]) => Promise<boolean>; onCreateSchedule: (doctorId: number, payload: Parameters<typeof adminService.createSchedule>[1]) => Promise<boolean>; onUpdateSchedule: (doctorId: number, schedule: AdminSchedule, payload: Parameters<typeof adminService.updateSchedule>[1]) => Promise<boolean> }) {
  const [editing, setEditing] = useState<number | null>(null)
  const [addingSchedule, setAddingSchedule] = useState<number | null>(null)
  return <><PageHeading kicker="TENAGA MEDIS" title="Dokter & Jadwal Praktik" description="Kelola profil dokter, kuota, dan jadwal tanpa konflik." /><section className="admin-panel admin-management"><Toolbar search={search} onSearch={onSearch} placeholder="Cari dokter, spesialisasi, atau nomor SIP..." />{loading ? <AdminLoading label="Memuat dokter dan jadwal..." /> : !doctors.length ? <Empty title="Dokter tidak ditemukan" text="Tambahkan akun dengan role dokter melalui menu Pengguna." /> : <div className="admin-doctor-list">{doctors.map(doctor => <article className="admin-doctor-card" key={doctor.id}><div className="admin-doctor-summary"><span className="admin-avatar doctor">{userInitials(doctor.user.name)}</span><div><strong>{doctor.user.name}</strong><small>{doctor.specialty.name} · SIP {doctor.licenseNumber}</small></div><span className={`admin-account-state ${doctor.user.isActive ? 'active' : ''}`}>{doctor.user.isActive ? 'Aktif' : 'Nonaktif'}</span><button className="admin-secondary compact" onClick={() => setEditing(editing === doctor.id ? null : doctor.id)}>Ubah profil</button></div>{editing === doctor.id && <DoctorEditForm doctor={doctor} specialties={specialties} busy={busyId === doctor.id} onCancel={() => setEditing(null)} onSave={async payload => { if (await onUpdateDoctor(doctor, payload)) setEditing(null) }} />}<div className="admin-schedule-head"><div><strong>Jadwal praktik</strong><small>{doctor.schedules.filter(item => item.isActive).length} jadwal aktif</small></div><button onClick={() => setAddingSchedule(addingSchedule === doctor.id ? null : doctor.id)}><Plus size={15} />Tambah jadwal</button></div>{addingSchedule === doctor.id && <ScheduleForm busy={busyId === doctor.id} onCancel={() => setAddingSchedule(null)} onSave={async payload => { if (await onCreateSchedule(doctor.id, payload)) setAddingSchedule(null) }} />}<div className="admin-schedule-list">{doctor.schedules.map(schedule => <div key={schedule.id} className={!schedule.isActive ? 'inactive' : ''}><span><strong>{schedule.code}</strong><small>{dayLabels[schedule.day]}, {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)} WIB</small></span><b>Kuota {schedule.quota}</b><label className="admin-switch"><input type="checkbox" checked={schedule.isActive} disabled={busyId === schedule.id} onChange={() => void onUpdateSchedule(doctor.id, schedule, { isActive: !schedule.isActive })} /><span /><em>{schedule.isActive ? 'Aktif' : 'Nonaktif'}</em></label></div>)}</div></article>)}</div>}</section></>
}

function DoctorEditForm({ doctor, specialties, busy, onCancel, onSave }: { doctor: AdminDoctor; specialties: AdminSpecialty[]; busy: boolean; onCancel: () => void; onSave: (payload: Parameters<typeof adminService.updateDoctor>[1]) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void onSave({ name: String(data.get('name')), specialtyId: Number(data.get('specialtyId')), licenseNumber: String(data.get('licenseNumber')), experienceYears: Number(data.get('experienceYears')), bio: String(data.get('bio')) })
  }
  return <form className="admin-inline-form" onSubmit={submit}><FormField label="Nama dokter"><input name="name" defaultValue={doctor.user.name} required /></FormField><FormField label="Spesialisasi"><select name="specialtyId" defaultValue={doctor.specialty.id}>{specialties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField label="Nomor SIP"><input name="licenseNumber" defaultValue={doctor.licenseNumber} required /></FormField><FormField label="Pengalaman"><input name="experienceYears" type="number" min="0" max="70" defaultValue={doctor.experienceYears} /></FormField><FormField label="Bio dokter" wide><textarea name="bio" rows={2} defaultValue={doctor.bio ?? ''} /></FormField><div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={onCancel}>Batal</button><button className="admin-primary" disabled={busy}><Save size={15} />Simpan profil</button></div></form>
}

function ScheduleForm({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: (payload: Parameters<typeof adminService.createSchedule>[1]) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void onSave({ code: String(data.get('code')), day: String(data.get('day')) as AdminDay, startTime: String(data.get('startTime')), endTime: String(data.get('endTime')), quota: Number(data.get('quota')) })
  }
  return <form className="admin-inline-form schedule" onSubmit={submit}><FormField label="Kode jadwal"><input name="code" placeholder="PD-SEN" maxLength={12} required /></FormField><FormField label="Hari"><select name="day">{dayOptions.map(day => <option value={day} key={day}>{dayLabels[day]}</option>)}</select></FormField><FormField label="Jam mulai"><input name="startTime" type="time" required /></FormField><FormField label="Jam selesai"><input name="endTime" type="time" required /></FormField><FormField label="Kuota"><input name="quota" type="number" min="1" max="500" defaultValue="20" required /></FormField><div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={onCancel}>Batal</button><button className="admin-primary" disabled={busy}>Tambah</button></div></form>
}

function ReportsPanel({ report, loading, from, to, onFrom, onTo, onLoad }: { report: AdminReport | null; loading: boolean; from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void; onLoad: () => void }) {
  const exportSpreadsheet = () => {
    if (!report) return
    const rows = [['Dokter', 'Spesialisasi', 'Total Kunjungan', 'Selesai', 'Dibatalkan', 'Tingkat Penyelesaian'], ...report.doctorPerformance.map(item => [item.name, item.specialty, item.total, item.completed, item.cancelled, `${item.completionRate}%`])]
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-anahita-${report.period.from}-${report.period.to}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  if (loading && !report) return <AdminLoading label="Menyusun laporan operasional..." />
  const maxVisits = Math.max(1, ...(report?.visits.map(item => item.count) ?? [1]))
  return <><PageHeading kicker="PELAPORAN MANAJEMEN" title="Laporan Operasional" description="Analisis kunjungan pasien dan kinerja dokter berdasarkan periode." action={<div className="admin-report-actions"><button className="admin-secondary" disabled={!report} onClick={() => window.print()}>Simpan PDF</button><button className="admin-primary" disabled={!report} onClick={exportSpreadsheet}>Unduh spreadsheet</button></div>} /><section className="admin-panel admin-report-filter"><FormField label="Tanggal awal"><input type="date" value={from} max={to} onChange={event => onFrom(event.target.value)} /></FormField><FormField label="Tanggal akhir"><input type="date" value={to} min={from} max={todayInJakarta()} onChange={event => onTo(event.target.value)} /></FormField><button className="admin-primary" disabled={loading} onClick={onLoad}><RefreshCw size={16} />Terapkan periode</button></section>{report && <><section className="admin-metrics report"><Metric label="Total kunjungan" value={report.metrics.totalVisits} note={`${report.period.from} s.d. ${report.period.to}`} icon={<CalendarDays size={20} />} tone="emerald" /><Metric label="Pemeriksaan selesai" value={report.metrics.completedVisits} note="Kunjungan berstatus selesai" icon={<ClipboardList size={20} />} tone="blue" /><Metric label="Pasien baru" value={report.metrics.newPatients} note="Terdaftar pada periode" icon={<UserPlus size={20} />} tone="violet" /><Metric label="Total pasien" value={report.metrics.totalPatients} note="Seluruh rekam medis" icon={<UsersRound size={20} />} tone="amber" /></section><section className="admin-overview-grid report-grid"><article className="admin-panel admin-trend"><div className="admin-panel-heading"><div><h2>Tren Kunjungan</h2><p>Data nyata appointment pada periode terpilih</p></div></div><div className="admin-report-chart"><div className="admin-report-chart-inner">{report.visits.map(item => <div className="admin-bar-column" key={item.date}><b>{item.count}</b><span><i style={{ height: `${Math.max(6, (item.count / maxVisits) * 100)}%` }} /></span><small>{new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${item.date}T00:00:00Z`))}</small></div>)}</div></div></article><article className="admin-panel admin-revenue-pending"><FileBarChart size={27} /><span>MODUL TAHAP LANJUT</span><h2>Laporan Pendapatan</h2><p>{report.revenue.note}</p><small>Release 3 · Kasir & Penagihan</small></article></section><section className="admin-panel admin-management"><div className="admin-panel-heading"><div><h2>Kinerja Dokter</h2><p>Jumlah kunjungan dan tingkat penyelesaian pemeriksaan.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Dokter</th><th>Spesialisasi</th><th>Kunjungan</th><th>Selesai</th><th>Dibatalkan</th><th>Penyelesaian</th></tr></thead><tbody>{report.doctorPerformance.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.specialty}</td><td>{item.total}</td><td>{item.completed}</td><td>{item.cancelled}</td><td><span className="admin-rate">{item.completionRate}%</span></td></tr>)}</tbody></table></div></section></>}</>
}

function AuditPanel({ logs, loading, search, onSearch }: { logs: AdminAuditLog[]; loading: boolean; search: string; onSearch: (value: string) => void }) {
  return <><PageHeading kicker="KEAMANAN & KETERTELUSURAN" title="Audit Log Aktivitas" description="Riwayat tindakan penting, pengguna, waktu, dan objek yang berubah." /><section className="admin-panel admin-management"><Toolbar search={search} onSearch={onSearch} placeholder="Cari pengguna, tindakan, atau objek..." />{loading ? <AdminLoading label="Memuat audit log..." /> : !logs.length ? <Empty title="Aktivitas tidak ditemukan" text="Audit log akan terisi saat pengguna melakukan tindakan penting." /> : <div className="admin-audit-list">{logs.map(log => <article key={log.id}><span className={`admin-audit-icon ${log.action.toLowerCase()}`}><ListChecks size={17} /></span><div><strong>{log.description}</strong><small>{log.user?.name ?? 'Sistem'} · {roleLabels[log.user?.role ?? 'ADMIN']} · {log.entity}{log.entityId ? ` #${log.entityId}` : ''}</small></div><time dateTime={log.createdAt}>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.createdAt))}</time></article>)}</div>}</section></>
}

function SettingsPanel({ settings, loading, busyId, onSave }: { settings: AdminSetting[]; loading: boolean; busyId: number | null; onSave: (setting: AdminSetting, value: string) => Promise<void> }) {
  const groups = useMemo(() => Object.entries(settings.reduce<Record<string, AdminSetting[]>>((result, setting) => { (result[setting.group] ??= []).push(setting); return result }, {})), [settings])
  return <><PageHeading kicker="KONFIGURASI SISTEM" title="Pengaturan Operasional" description="Kelola identitas rumah sakit, pendaftaran, dan parameter antrean." />{loading ? <AdminLoading label="Memuat konfigurasi..." /> : <div className="admin-settings-grid">{groups.map(([group, items]) => <section className="admin-panel admin-setting-group" key={group}><div className="admin-panel-heading"><div><h2>{settingGroupLabel(group)}</h2><p>{settingGroupDescription(group)}</p></div></div>{items.map(setting => <SettingRow setting={setting} busy={busyId === setting.id} onSave={onSave} key={`${setting.id}-${setting.updatedAt}`} />)}</section>)}</div>}</>
}

function SettingRow({ setting, busy, onSave }: { setting: AdminSetting; busy: boolean; onSave: (setting: AdminSetting, value: string) => Promise<void> }) {
  const [value, setValue] = useState(setting.value)
  return <div className="admin-setting-row"><label htmlFor={`setting-${setting.key}`}><strong>{setting.label}</strong><small>{setting.description}</small></label><div><input id={`setting-${setting.key}`} type={setting.valueType === 'EMAIL' ? 'email' : setting.valueType === 'NUMBER' ? 'number' : 'text'} value={value} onChange={event => setValue(event.target.value)} /><button disabled={busy || value === setting.value} onClick={() => void onSave(setting, value)}><Save size={16} /><span>Simpan</span></button></div></div>
}

function settingGroupLabel(group: string) { return ({ GENERAL: 'Identitas Rumah Sakit', CONTACT: 'Informasi Kontak', REGISTRATION: 'Pendaftaran', QUEUE: 'Antrean Digital' } as Record<string, string>)[group] ?? group }
function settingGroupDescription(group: string) { return ({ GENERAL: 'Informasi utama yang tampil pada sistem.', CONTACT: 'Kanal layanan yang dapat dihubungi pasien.', REGISTRATION: 'Aturan dasar pendaftaran kunjungan.', QUEUE: 'Parameter operasional antrean pasien.' } as Record<string, string>)[group] ?? 'Konfigurasi operasional SIMRS.' }

function Metric({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: ReactNode; tone: string }) {
  return <article><span className={`admin-metric-icon ${tone}`}>{icon}</span><div><p>{label}</p><strong>{value.toLocaleString('id-ID')}</strong><small>{note}</small></div></article>
}

function PageHeading({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: ReactNode }) {
  return <section className="admin-page-heading"><div><span className="admin-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>{action}</section>
}

function Toolbar({ search, onSearch, placeholder, extra }: { search: string; onSearch: (value: string) => void; placeholder: string; extra?: ReactNode }) {
  return <div className="admin-toolbar"><label className="admin-search"><Search size={18} /><input value={search} onChange={event => onSearch(event.target.value)} placeholder={placeholder} /><span className="sr-only">Pencarian</span></label>{extra}</div>
}

function FormField({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`admin-form-field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>
}

function Empty({ title, text, icon }: { title?: string; text: string; icon?: ReactNode }) {
  return <div className="admin-empty">{icon ?? <Search size={28} />}{title && <h2>{title}</h2>}<p>{text}</p></div>
}

function AdminLoading({ label }: { label: string }) {
  return <div className="admin-loading"><span className="spinner" /><p>{label}</p></div>
}
