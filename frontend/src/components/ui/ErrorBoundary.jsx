import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
          <div className="max-w-md rounded-2xl border border-danger-200 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 text-3xl">
              ⚠️
            </div>
            <h1 className="mb-2 text-xl font-bold text-slate-900">Error en la aplicación</h1>
            <p className="mb-6 text-sm text-slate-600">
              Ocurrió un error inesperado. Revisa la consola del navegador (F12) para más detalles.
            </p>
            <pre className="mb-6 max-h-32 overflow-auto rounded-xl bg-slate-100 p-4 text-left text-xs text-slate-700">
              {this.state.error?.message || 'Error desconocido'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/login'
              }}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
