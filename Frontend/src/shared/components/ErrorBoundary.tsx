import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Frontend gagal merender halaman.', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return <main className="fatal-error" role="alert">
      <span><AlertTriangle size={30} /></span>
      <p className="section-kicker">GANGGUAN TAMPILAN</p>
      <h1>Halaman belum dapat ditampilkan</h1>
      <p>Muat ulang halaman untuk memulihkan tampilan. Jika masalah berulang, hubungi pengelola sistem.</p>
      <button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={17} /> Muat ulang halaman</button>
    </main>
  }
}
