import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { StudentMobileLayout } from './layouts/StudentMobileLayout'
import { AdminDesktopLayout } from './layouts/AdminDesktopLayout'

import { Login } from './pages/Login'
import { TerminosCondiciones } from './pages/TerminosCondiciones'
import { PoliticaPrivacidad } from './pages/PoliticaPrivacidad'
import { HomeRecomendaciones } from './pages/student/HomeRecomendaciones'
import { ExploradorFranjas } from './pages/student/ExploradorFranjas'
import { MisCupos } from './pages/student/MisCupos'
import { Perfil } from './pages/student/Perfil'
import { DashboardAnalitico } from './pages/admin/DashboardAnalitico'
import { ScannerHub } from './pages/admin/ScannerHub'
import { AdminUsuarios } from './pages/admin/AdminUsuarios'
import { AdminConfig } from './pages/admin/AdminConfig'
import { Toast } from './components/ui/Toast'

function App() {
  const { usuario, login, logout } = useAuth()
  const [notice, setNotice] = useState(null)

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message })
  }, [])

  const handleLogin = useCallback(async (id, pw) => {
    const data = await login(id, pw)
    const esAdmin = data.rol === 'administrador'
    window.location.href = esAdmin ? '/admin' : '/home'
  }, [login])

  const handleLogout = useCallback(() => {
    logout()
    window.location.href = '/login'
  }, [logout])

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/terminos" element={<TerminosCondiciones />} />
        <Route path="/privacidad" element={<PoliticaPrivacidad />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const esAdmin = usuario.rol === 'administrador'

  return (
    <>
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <Routes>
        {esAdmin ? (
          <Route
            element={
              <AdminDesktopLayout usuario={usuario} onLogout={handleLogout} />
            }
          >
            <Route path="/admin" element={<DashboardAnalitico onNotice={showNotice} />} />
            <Route path="/admin/scanner" element={<ScannerHub onNotice={showNotice} />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios onNotice={showNotice} />} />
            <Route path="/admin/config" element={<AdminConfig onNotice={showNotice} />} />
          </Route>
        ) : (
          <Route
            element={
              <StudentMobileLayout usuario={usuario} onLogout={handleLogout} />
            }
          >
            <Route path="/home" element={<HomeRecomendaciones onNotice={showNotice} />} />
            <Route path="/explorar" element={<ExploradorFranjas onNotice={showNotice} />} />
            <Route path="/mis-cupos" element={<MisCupos onNotice={showNotice} />} />
            <Route path="/perfil" element={<Perfil usuario={usuario} />} />
          </Route>
        )}

        <Route path="/login" element={<Navigate to={esAdmin ? '/admin' : '/home'} replace />} />
        <Route path="*" element={<Navigate to={esAdmin ? '/admin' : '/home'} replace />} />
      </Routes>
    </>
  )
}

export default App
