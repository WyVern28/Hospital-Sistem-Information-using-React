import { useCallback, useEffect, useState } from 'react'
import PatientRoutes from '../routes/PatientRoutes'
import { SESSION_EXPIRED_EVENT } from '../../../services/api'
import type { AuthSession, Page } from '../../../types'

const paths: Record<Page, string> = {
  home: '/',
  services: '/layanan',
  doctors: '/dokter',
  registration: '/pendaftaran',
  queue: '/antrean',
  history: '/riwayat',
  contact: '/kontak',
  login: '/masuk',
  signup: '/daftar-akun',
}

const pageByPath = Object.fromEntries(Object.entries(paths).map(([page, path]) => [path, page])) as Record<string, Page>
const protectedPages: Page[] = ['registration', 'history']

function pageFromLocation() {
  return pageByPath[window.location.pathname.replace(/\/$/, '') || '/'] ?? 'home'
}

type PatientPortalProps = {
  session: AuthSession | null
  onAuthenticated: (session: AuthSession) => void
  onLogout: () => void
}

export default function PatientPortal({ session, onAuthenticated, onLogout }: PatientPortalProps) {
  const initialPage = pageFromLocation()
  const initialProtectedPage = !session && protectedPages.includes(initialPage) ? initialPage : 'home'
  const [page, setPage] = useState<Page>(initialProtectedPage === 'home' ? initialPage : 'login')
  const [notice, setNotice] = useState(initialProtectedPage === 'home' ? '' : 'Silakan masuk untuk mengakses layanan pasien.')
  const [requestedPage, setRequestedPage] = useState<Page>(initialProtectedPage)

  const showPage = useCallback((next: Page, historyMode: 'push' | 'replace' | 'none' = 'push') => {
    setPage(next)
    if (historyMode === 'push') window.history.pushState({ page: next }, '', paths[next])
    if (historyMode === 'replace') window.history.replaceState({ page: next }, '', paths[next])
    window.scrollTo({ top: 0, behavior: historyMode === 'none' ? 'auto' : 'smooth' })
  }, [])

  const navigate = (next: Page) => {
    if (!session && protectedPages.includes(next)) {
      setRequestedPage(next)
      setNotice('Silakan masuk untuk mengakses layanan pasien.')
      showPage('login')
    } else {
      setNotice('')
      showPage(next)
    }
  }

  useEffect(() => {
    const onPopState = () => {
      const next = pageFromLocation()
      if (!session && protectedPages.includes(next)) {
        setRequestedPage(next)
        setNotice('Silakan masuk untuk mengakses layanan pasien.')
        showPage('login', 'replace')
        return
      }
      setNotice('')
      showPage(next, 'none')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [session, showPage])

  useEffect(() => {
    const onSessionExpired = () => {
      if (!protectedPages.includes(page)) return
      setRequestedPage(page)
      setNotice('Sesi Anda telah berakhir. Silakan masuk kembali.')
      showPage('login', 'replace')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [page, showPage])

  useEffect(() => {
    const labels: Record<Page, string> = {
      home: 'Beranda', services: 'Layanan', doctors: 'Dokter', registration: 'Pendaftaran',
      queue: 'Antrean', history: 'Riwayat', contact: 'Kontak', login: 'Masuk', signup: 'Daftar Akun',
    }
    document.title = `${labels[page]} | Anahita Hospital`
  }, [page])

  useEffect(() => {
    if (page === 'login' && protectedPages.includes(pageFromLocation())) {
      window.history.replaceState({ page: 'login' }, '', paths.login)
    }
  }, [page])

  const authenticated = (next: AuthSession) => {
    onAuthenticated(next)
    setNotice(`Selamat datang, ${next.user.name}.`)
    showPage(requestedPage === 'home' ? 'history' : requestedPage, 'replace')
    setRequestedPage('home')
  }

  const logout = () => {
    onLogout()
    setRequestedPage('home')
    showPage('home', 'replace')
    setNotice('Anda berhasil keluar dari portal.')
  }

  return <PatientRoutes page={page} notice={notice} session={session} navigate={navigate} setNotice={setNotice} onAuthenticated={authenticated} onLogout={logout} />
}
