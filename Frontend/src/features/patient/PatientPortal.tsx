import { useState } from 'react'
import PatientRoutes from '../../routes/PatientRoutes'
import type { Page } from '../../types'

/** Patient-facing application module and navigation. */
export default function PatientPortal() {
  const [page, setPage] = useState<Page>('home')
  const [notice, setNotice] = useState('')
  const navigate = (next: Page) => { setPage(next); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <PatientRoutes page={page} notice={notice} navigate={navigate} setNotice={setNotice} />
}
