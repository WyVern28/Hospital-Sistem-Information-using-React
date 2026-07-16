import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import HomePage from '../pages/HomePage'
import ServicesPage from '../pages/ServicesPage'
import DoctorsPage from '../pages/DoctorsPage'
import { EditRegistrationPage, HistoryPage, QueuePage, RegistrationPage } from '../pages/AppointmentPages'
import { ContactPage, LoginPage, SignupPage } from '../pages/MiscPages'
import type { Page } from '../types'

type PatientRoutesProps = {
  page: Page
  notice: string
  navigate: (page: Page) => void
  setNotice: (notice: string) => void
}

/** Preserves the patient portal's existing state-driven navigation map. */
export default function PatientRoutes({ page, notice, navigate, setNotice }: PatientRoutesProps) {
  return <div className="app"><Header page={page} onNavigate={navigate} />{notice && <div className="toast" role="status">{notice}</div>}{page === 'home' && <HomePage onNavigate={navigate} />}{page === 'services' && <ServicesPage onNavigate={navigate} />}{page === 'doctors' && <DoctorsPage onNavigate={navigate} />}{page === 'registration' && <RegistrationPage onDone={message => { setNotice(message); navigate('history') }} />}{page === 'edit' && <EditRegistrationPage onDone={() => { setNotice('Jadwal kunjungan berhasil diperbarui.'); navigate('history') }} onCancel={() => navigate('history')} />}{page === 'queue' && <QueuePage />}{page === 'history' && <HistoryPage onRegister={() => navigate('registration')} onEdit={() => navigate('edit')} />}{page === 'contact' && <ContactPage />}{page === 'login' && <LoginPage onSuccess={() => navigate('home')} onSignup={() => navigate('signup')} />}{page === 'signup' && <SignupPage onDone={() => { setNotice('Akun demo berhasil dibuat. Silakan masuk.'); navigate('login') }} />}{!['login', 'signup'].includes(page) && <Footer onNavigate={navigate} />}</div>
}
