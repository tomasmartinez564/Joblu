import { useState, useEffect, Suspense, lazy } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'

// --- Estilos ---
import './App.css'
import "./styles/header.css"
import "./styles/footer.css"

// --- Páginas (Estática para LCP) ---
import Home from './pages/Home.jsx'

// --- Páginas (Lazy Loading) ---
const CvBuilder = lazy(() => import('./pages/CvBuilder.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const Jobs = lazy(() => import('./pages/Jobs.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const MyCvs = lazy(() => import('./pages/MyCvs.jsx'))
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'))
const JobDetail = lazy(() => import('./pages/JobDetail.jsx'))
const PostDetail = lazy(() => import("./pages/PostDetail"))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ScrollToTop from "./components/ScrollToTop"
import ProtectedRoute from "./components/ProtectedRoute"

// --- Contexto y Configuración ---
import { ToastProvider } from './context/ToastContext'
import API_BASE_URL from './config/api'

// ==========================================
// 📋 CONSTANTES Y CONFIGURACIÓN INICIAL
// ==========================================
const LS_USER_KEY = 'joblu_user'
const LS_SETTINGS_KEY = 'joblu_settings'
const LS_CVS_KEY = 'joblu_savedCvs'
const LS_SAVED_JOBS_KEY = 'joblu_savedJobs'

const defaultSettings = {
  cvLanguage: 'es',
  cvStyle: 'ats',
  targetIndustry: '',
  includePhoto: true,
  showTips: true,
  darkMode: false,
}

// ==========================================
// 🏗️ DISEÑO PRINCIPAL (AppLayout)
// ==========================================
function AppLayout() {
  const navigate = useNavigate()

  // --- Estados: Usuario y Cuenta ---
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- Estados: Empleos Guardados ---
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SAVED_JOBS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  // --- Estados: Preferencias ---
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (!raw) return defaultSettings
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    } catch { return defaultSettings }
  })

  // --- Effects (Persistencia y Lógica de Interfaz) ---
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(LS_USER_KEY)
      }
    } catch { }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED_JOBS_KEY, JSON.stringify(savedJobs))
    } catch { }
  }, [savedJobs])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
      if (settings.darkMode) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
    } catch { }
  }, [settings])

  // --- Handlers: Autenticación ---
  const handleLogin = (userData, token) => {
    setUser(userData)
    setIsAccountMenuOpen(false)
    try {
      if (token) localStorage.setItem('joblu_token', token)
      localStorage.setItem(LS_USER_KEY, JSON.stringify(userData))
    } catch { }
    navigate('/cv')
  }

  const handleLogout = () => {
    setUser(null)
    setIsAccountMenuOpen(false)
    try {
      localStorage.removeItem('joblu_token')
      localStorage.removeItem(LS_USER_KEY)
    } catch { }
    navigate('/')
  }

  // --- Handlers: Acciones de Usuario ---
  const handleUpdateUser = (updates) => {
    if (!user) return
    setUser((prev) => ({ ...prev, ...updates }))
  }

  const handleCreateCv = () => navigate('/cv')

  const goToAccount = () => {
    setIsAccountMenuOpen(false)
    navigate('/cuenta')
  }

  const toggleSavedJob = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )
  }

  // --- Renderizado ---
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isAccountMenuOpen={isAccountMenuOpen}
        setIsAccountMenuOpen={setIsAccountMenuOpen}
        navigate={navigate}
        handleLogout={handleLogout}
        goToAccount={goToAccount}
        onCreateCv={handleCreateCv}
      />

      <main className="app-main">
        <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route
              path="/cv"
              element={
                <ProtectedRoute user={user}>
                  <CvBuilder user={user} settings={settings} onChangeSettings={setSettings} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cv/:id"
              element={
                <ProtectedRoute user={user}>
                  <CvBuilder user={user} settings={settings} onChangeSettings={setSettings} />
                </ProtectedRoute>
              }
            />
            <Route path="/comunidad" element={<Community user={user} />} />
            <Route path="/comunidad/:id" element={<PostDetail user={user} />} />
            <Route path="/jobs" element={<Jobs savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
            <Route path="/jobs/:id" element={<JobDetail savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/mis-cvs"
              element={
                <ProtectedRoute user={user}>
                  <MyCvs user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cuenta"
              element={
                <ProtectedRoute user={user}>
                  <AccountSettings
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    settings={settings}
                    onChangeSettings={setSettings}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}

// ==========================================
// 🚀 PUNTO DE ENTRADA (Wrapper)
// ==========================================
function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  )
}

export default App