import { type FormEvent, useState } from 'react'
import { AlertTriangle, Clock3, Eye, EyeOff, LockKeyhole, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import Field from '../../../shared/components/ui/Field'
import { api, apiErrorMessage } from '../../../services/api'
import type { AuthSession } from '../../../types'

export function ContactPage() {
  return <main><section className="page-hero compact"><span className="eyebrow">KONTAK & LOKASI</span><h1>Kami siap membantu Anda</h1><p>Temukan saluran yang tepat untuk informasi layanan, jadwal, atau keadaan darurat.</p></section><section className="section contact-grid"><article className="contact-info"><span className="demo-label"><AlertTriangle size={13} /> DATA DEMONSTRASI</span><h2>Informasi kontak</h2><ul className="contact-list"><li><MapPin size={20} /><span><b>Alamat</b>Jl. Sehat No. 123, Jakarta</span></li><li><Phone size={20} /><span><b>Telepon</b><a href="tel:+622155501200">+62 21 5550 1200</a></span></li><li><Mail size={20} /><span><b>Email</b><a href="mailto:care@anahitahospital.id">care@anahitahospital.id</a></span></li><li><Clock3 size={20} /><span><b>Jam operasional</b>Senin–Minggu, 24 jam</span></li></ul><small>Ganti alamat, nomor, dan email ini dengan data resmi rumah sakit sebelum publikasi.</small></article><article className="form-card contact-actions"><span className="contact-icon"><ShieldCheck size={26} /></span><h2>Saluran bantuan</h2><p>Untuk konsultasi administrasi, gunakan email. Untuk kondisi darurat, segera telepon IGD atau layanan darurat setempat.</p><div className="contact-button-grid"><a className="button primary" href="mailto:care@anahitahospital.id?subject=Pertanyaan%20Layanan%20Anahita"><Mail size={17} /> Kirim Email</a><a className="button secondary" href="tel:+622155501200"><Phone size={17} /> Telepon IGD</a></div><div className="emergency-note"><AlertTriangle size={18} /><span><b>Kondisi darurat?</b> Jangan menunggu balasan email. Hubungi layanan darurat terdekat.</span></div></article></section></main>
}

export function LoginPage({ onSuccess, onSignup }: { onSuccess: (session: AuthSession) => void; onSignup: () => void }) {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<AuthSession>('/auth/login', { emailOrPhone, password })
      onSuccess(data)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><span className="auth-symbol" aria-hidden="true"><LockKeyhole size={25} /></span><span className="section-kicker">PORTAL AMAN</span><h1>Selamat datang kembali</h1><p>Masuk untuk mengakses layanan sesuai peran akun Anda.</p><Field label="Email atau nomor telepon"><input autoComplete="username" required value={emailOrPhone} onChange={event => setEmailOrPhone(event.target.value)} placeholder="nama@email.com" /></Field><div className="field"><label htmlFor="login-password">Kata sandi</label><span className="password-control"><input id="login-password" autoComplete="current-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword(show => !show)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></div>{error && <div className="alert error-alert" role="alert">{error}</div>}<button className="button primary full" disabled={loading}>{loading ? <><span className="button-spinner" /> Memeriksa...</> : 'Masuk'}</button><p className="auth-switch">Belum punya akun? <button type="button" className="link-button" onClick={onSignup}>Daftar akun pasien</button></p></form></main>
}

export function SignupPage({ onDone }: { onDone: (session: AuthSession) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', nik: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.password !== form.confirm) return setError('Konfirmasi kata sandi tidak sama.')
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<AuthSession>('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        nik: form.nik,
        password: form.password,
      })
      onDone(data)
    } catch (reason) {
      setError(apiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  const passwordScore = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password)].filter(Boolean).length

  return <main className="auth-page"><form className="auth-card signup-card" onSubmit={submit}><span className="auth-symbol" aria-hidden="true"><ShieldCheck size={25} /></span><span className="section-kicker">AKUN PASIEN</span><h1>Buat akun baru</h1><p>Gunakan data fiktif selama demonstrasi dan jangan memasukkan data kesehatan nyata.</p><Field label="Nama lengkap"><input autoComplete="name" required minLength={3} value={form.name} onChange={event => update('name', event.target.value)} /></Field><Field label="NIK (16 digit)"><input inputMode="numeric" pattern="[0-9]{16}" required maxLength={16} value={form.nik} onChange={event => update('nik', event.target.value.replace(/\D/g, ''))} /></Field><Field label="Email"><input autoComplete="email" required type="email" value={form.email} onChange={event => update('email', event.target.value)} /></Field><Field label="Nomor telepon (opsional)"><input autoComplete="tel" inputMode="tel" value={form.phone} onChange={event => update('phone', event.target.value)} /></Field><div className="field"><label htmlFor="signup-password">Kata sandi</label><span className="password-control"><input id="signup-password" autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={event => update('password', event.target.value)} /><button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword(show => !show)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></div>{form.password && <div className={`password-strength score-${passwordScore}`} aria-live="polite"><span><i /><i /><i /></span><small>{passwordScore === 3 ? 'Kata sandi kuat' : 'Gunakan minimal 8 karakter, huruf besar, dan angka'}</small></div>}<Field label="Ulangi kata sandi"><input autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={event => update('confirm', event.target.value)} /></Field>{error && <div className="alert error-alert" role="alert">{error}</div>}<button className="button primary full" disabled={loading}>{loading ? <><span className="button-spinner" /> Membuat akun...</> : 'Daftar Akun'}</button></form></main>
}
