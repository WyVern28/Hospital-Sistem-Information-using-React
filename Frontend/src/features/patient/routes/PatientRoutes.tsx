import Header from '../../../shared/components/layout/Header'
import Footer from '../../../shared/components/layout/Footer'
import HomePage from '../../public/pages/HomePage'
import ServicesPage from '../../public/pages/ServicesPage'
import DoctorsPage from '../../public/pages/DoctorsPage'
import { HistoryPage, QueuePage, RegistrationPage } from '../pages/AppointmentPages'
import { ContactPage, LoginPage, SignupPage } from '../../public/pages/MiscPages'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { AuthSession, Page } from '../../../types'

type PatientRoutesProps = {
  page: Page
  notice: string
  session: AuthSession | null
  navigate: (page: Page) => void
  setNotice: (notice: string) => void
  onAuthenticated: (session: AuthSession) => void
  onLogout: () => void
}

/** Preserves the patient portal's existing state-driven navigation map. */
export default function PatientRoutes({ page, notice, session, navigate, setNotice, onAuthenticated, onLogout }: PatientRoutesProps) {
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timer)
  }, [notice, setNotice])

  return <div className="app">
    <Header page={page} session={session} onNavigate={navigate} onLogout={onLogout} />
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Tutup pemberitahuan" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {page === 'home' && <HomePage onNavigate={navigate} />}
    {page === 'services' && <ServicesPage onNavigate={navigate} />}
    {page === 'doctors' && <DoctorsPage onNavigate={navigate} />}
    {page === 'registration' && session && <RegistrationPage onDone={message => { navigate('history'); setNotice(message) }} />}
    {page === 'queue' && <QueuePage />}
    {page === 'history' && session && <HistoryPage onRegister={() => navigate('registration')} />}
    {page === 'contact' && <ContactPage />}
    {page === 'login' && <LoginPage onSuccess={onAuthenticated} onSignup={() => navigate('signup')} />}
    {page === 'signup' && <SignupPage onDone={onAuthenticated} />}
    {!['login', 'signup'].includes(page) && <Footer onNavigate={navigate} />}
  </div>
}
