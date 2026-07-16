import type { Page } from '../../types'

export default function Header({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const links: Array<[Page, string]> = [['home', 'Beranda'], ['services', 'Layanan'], ['doctors', 'Dokter'], ['registration', 'Pendaftaran'], ['contact', 'Kontak']]
  return <header className="site-header"><button className="brand" onClick={() => onNavigate('home')}><span className="brand-mark">+</span><span>Anahita Hospital</span></button><nav className="nav-links" aria-label="Navigasi utama">{links.map(([target, label]) => <button key={target} className={page === target ? 'active' : ''} onClick={() => onNavigate(target)}>{label}</button>)}</nav><div className="header-actions"><button className="text-button" onClick={() => onNavigate('login')}>Masuk</button><button className="button primary small" onClick={() => onNavigate('queue')}>Cek Antrean</button></div></header>
}
