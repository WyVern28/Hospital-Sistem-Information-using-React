import { type FormEvent, useState } from 'react'
import Home from './Home'
import Services from './Services'
import './App.css'

function App() {
  const [view, setView] = useState<'home' | 'login' | 'services'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) {
      setError('Silakan isi email dan password terlebih dahulu.')
      return
    }
    if (email === 'admin@hospital.com' && password === 'admin123') {
      setError('')
      setView('home')
      return
    }
    setError('Kredensial tidak sesuai. Coba admin@hospital.com / admin123.')
  }

  const goToServices = () => {
    setView('services')
    // ensure top of services page
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, 80)
  }

  return (
    <div>
      <header className={"site-header main"}>
        {view === 'login' ? (
          <>
            <div className="brand" onClick={() => setView('login')} style={{ cursor: 'pointer' }}>
              <div className="brand-logo">🏥</div>
              <div className="brand-name">Anahita Hospital</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="help-btn" title="Bantuan">?</button>
            </div>
          </>
        ) : (
          <>
            <div className="brand" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <div className="brand-logo">🏥</div>
              <div className="brand-name">Anahita Hospital</div>
            </div>
            <nav className="main-nav">
              <a href="#" className={view === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setView('home') }}>Home</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToServices() }}>Services</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('home') }}>Doctors</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('home') }}>Schedule</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('home') }}>Registration</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('home') }}>Contact</a>
            </nav>
            <div style={{ marginLeft: 'auto' }}>
              <button className="queue-btn" onClick={() => setView('login')}>Check Queue</button>
            </div>
          </>
        )}
      </header>

      {view === 'home' && <Home onLogin={() => setView('login')} />}
      {view === 'services' && <Services />}
      {view === 'login' && (
        <main className="centered">
          <div className="login-card-ref">
            <div className="card-top">
              <div className="avatar">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="3.2" stroke="#0f6b4b" strokeWidth="1.2" />
                  <path d="M4 19c1.8-3.6 5.6-6 8-6s6.2 2.4 8 6" stroke="#0f6b4b" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <h2>Masuk ke Akun Pasien</h2>
              <p className="muted">Kelola pendaftaran, cek antrean, dan lihat riwayat kunjungan Anda.</p>
            </div>

            <form className="form-ref" onSubmit={handleSubmit}>
              <label className="field">
                <span className="label-text">Email atau Nomor Telepon</span>
                <div className="input-wrap">
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>
              </label>

              <label className="field">
                <div className="field-top">
                  <span className="label-text">Kata Sandi</span>
                  <a className="forgot" href="#">Lupa Password?</a>
                </div>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </label>

              {error ? <p className="error-text">{error}</p> : null}

              <button className="btn-primary" type="submit">Masuk →</button>

              <div className="divider">Atau masuk dengan</div>

              <div className="socials">
                <button type="button" className="social google">Google</button>
                <button type="button" className="social card">Kartu Pasien</button>
              </div>

                <p className="register">Belum punya akun? <a href="#" onClick={(e) => { e.preventDefault(); /* registration removed */ }}>Daftar Akun Baru</a></p>
            </form>

            <div className="card-footer">
              <small>Data Aman & Terenskripsi • Dukungan 24/7</small>
            </div>
          </div>
        </main>
      )}

      {/* Registration view removed */}
    </div>
  )
}

export default App
