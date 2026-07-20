import { useEffect, useState } from 'react'
import DoctorPortal from './features/doctor/pages/DoctorPortal'
import AdminPortal from './features/admin/pages/AdminPortal'
import PatientPortal from './features/patient/pages/PatientPortal'
import { clearSession, loadSession, saveSession, SESSION_EXPIRED_EVENT } from './services/api'
import type { AuthSession } from './types'
import './App.css'
import './styles/refinement.css'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const onAuthenticated = (next: AuthSession) => { saveSession(next); setSession(next) }
  const logout = () => { clearSession(); setSession(null) }

  useEffect(() => {
    const expireSession = () => setSession(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession)
  }, [])

  if (session?.user.role === 'DOCTOR') {
    return <DoctorPortal session={session} onLogout={logout} />
  }

  if (session?.user.role === 'ADMIN') {
    return <AdminPortal session={session} onLogout={logout} />
  }

  return <PatientPortal session={session} onAuthenticated={onAuthenticated} onLogout={logout} />
}
