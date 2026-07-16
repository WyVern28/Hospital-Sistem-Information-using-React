import type { Page } from '../../types'

export default function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return <footer className="site-footer"><div><button className="brand" onClick={() => onNavigate('home')}><span className="brand-mark">+</span><span>Anahita Hospital</span></button><p>Rumah sakit masa depan dengan pelayanan yang mengutamakan manusia melalui integrasi teknologi digital.</p></div><div><h3>Navigasi Cepat</h3><button onClick={() => onNavigate('home')}>Tentang Kami</button><button onClick={() => onNavigate('services')}>Layanan Medis</button><button onClick={() => onNavigate('doctors')}>Fasilitas RS</button></div><div><h3>Kontak & Alamat</h3><p>⌖ 123 Healthcare Way, Jakarta<br />☎ (555) 0123-4567<br />✉ care@anahitahospital.id</p></div><div><h3>Newsletter</h3><p>Dapatkan tips kesehatan terbaru langsung di email Anda.</p><div className="newsletter"><input placeholder="Email Anda" /><button>→</button></div></div></footer>
}
