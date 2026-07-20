import { useEffect, useState } from 'react'
import { Activity, LogIn, LogOut, Menu, X } from 'lucide-react'
import type { AuthSession, Page } from '../../../types'

export default function Header({ page, session, onNavigate, onLogout }: { page: Page; session: AuthSession | null; onNavigate: (page: Page) => void; onLogout: () => void }) {
  const links: Array<[Page, string]> = [['home', 'Beranda'], ['services', 'Layanan'], ['doctors', 'Dokter'], ['registration', 'Pendaftaran'], ['contact', 'Kontak']]
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const go = (target: Page) => { setMenuOpen(false); onNavigate(target) }

  return <header className="site-header">
    <button className="brand" onClick={() => go('home')} aria-label="Beranda Anahita Hospital"><span className="brand-mark" aria-hidden="true">+</span><span className="brand-copy">Anahita Hospital<small>Digital Care</small></span></button>
    <nav id="main-navigation" className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navigasi utama">{links.map(([target, label]) => <button key={target} className={page === target ? 'active' : ''} aria-current={page === target ? 'page' : undefined} onClick={() => go(target)}>{label}</button>)}{session && <button className={page === 'history' ? 'active' : ''} aria-current={page === 'history' ? 'page' : undefined} onClick={() => go('history')}>Riwayat</button>}</nav>
    <div className="header-actions">{session ? <><span className="user-name">{session.user.name}</span><button className="text-button session-action" aria-label="Keluar dari akun" onClick={onLogout}><LogOut size={16} /><span className="header-action-label">Keluar</span></button></> : <button className="text-button session-action" aria-label="Masuk ke portal" onClick={() => go('login')}><LogIn size={16} /><span className="header-action-label">Masuk</span></button>}<button className="button primary small queue-action" onClick={() => go('queue')}><Activity size={16} /><span>Cek Antrean</span></button></div>
    <button className="menu-toggle" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
  </header>
}
