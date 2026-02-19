import { useState, useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'

// --- Estilos ---
import './App.css'
import "./styles/header.css"
import "./styles/footer.css"

// --- Páginas ---
import Home from './pages/Home.jsx'
import CvBuilder from './pages/CvBuilder.jsx'
import Community from './pages/Community.jsx'
import Jobs from './pages/Jobs.jsx'
import Login from './pages/Login.jsx'
import MyCvs from './pages/MyCvs.jsx'
import Settings from './pages/Settings.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import JobDetail from './pages/JobDetail.jsx'
import PostDetail from "./pages/PostDetail"
import NotFound from './pages/NotFound.jsx'

// --- Componentes ---
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

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
const LS_ONBOARDING_KEY = 'joblu_onboarding_done'

const defaultSettings = {
  cvLanguage: 'es',
  cvStyle: 'ats',
  targetIndustry: '',
  includePhoto: true,
  showTips: true,
  darkMode: false,
}

const onboardingSteps = [
  {
    title: "Bienvenido a JOBLU",
    text: "Acá vas a poder crear tu currículum de forma rápida, con vista previa y ayuda de inteligencia artificial.",
  },
  {
    title: "Crear CV y Mis CVs",
    text: "En la sección “Crear CV” completás tus datos. En “Mis CVs” vas a ver y gestionar los CVs que guardes.",
  },
  {
    title: "Comunidad",
    text: "En la Comunidad podés compartir experiencias, hacer preguntas y leer posteos de otros usuarios.",
  },
  {
    title: "Bolsa de trabajo",
    text: "En la Bolsa de trabajo vas a encontrar empleos filtrados por tipo, modalidad y categoría para postular con tu CV.",
  },
];

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

  // --- Estados: Preferencias y Onboarding ---
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (!raw) return defaultSettings
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    } catch { return defaultSettings }
  })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

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

      const done = localStorage.getItem(LS_ONBOARDING_KEY) === 'done'
      if (!done) {
        setOnboardingStep(0)
        setShowOnboarding(true)
      }
    } catch { }
    navigate('/cv')
  }

  const handleLogout = () => {
    setUser(null)
    setIsAccountMenuOpen(false)
    setShowOnboarding(false)
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

  // --- Handlers: Onboarding ---
  const finishOnboarding = () => {
    setShowOnboarding(false)
    try { localStorage.setItem(LS_ONBOARDING_KEY, 'done') } catch { }
  }

  const handleNextOnboarding = () => {
    if (onboardingStep + 1 < onboardingSteps.length) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      finishOnboarding()
    }
  }

  // --- Renderizado ---
  return (
    <div className="app">
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

      {user && showOnboarding && (
        <div className="onboarding-backdrop">
          <div className="onboarding-modal">
            <h2 className="onboarding-title">{onboardingSteps[onboardingStep].title}</h2>
            <p className="onboarding-text">{onboardingSteps[onboardingStep].text}</p>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-secondary" onClick={finishOnboarding}>Cerrar</button>
              <button type="button" className="onboarding-primary" onClick={handleNextOnboarding}>
                {onboardingStep + 1 < onboardingSteps.length ? 'Siguiente' : 'Empezar a usar JOBLU'}
              </button>
            </div>
            <div className="onboarding-dots">
              {onboardingSteps.map((_, index) => (
                <span key={index} className={'onboarding-dot' + (index === onboardingStep ? ' onboarding-dot-active' : '')} />
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/cv" element={<CvBuilder user={user} settings={settings} onChangeSettings={setSettings} />} />
          <Route path="/cv/:id" element={<CvBuilder user={user} settings={settings} onChangeSettings={setSettings} />} />
          <Route path="/comunidad" element={<Community user={user} />} />
          <Route path="/comunidad/:id" element={<PostDetail user={user} />} />
          <Route path="/jobs" element={<Jobs savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
          <Route path="/jobs/:id" element={<JobDetail savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/mis-cvs" element={<MyCvs user={user} />} />
          <Route path="/cuenta" element={<AccountSettings user={user} onUpdateUser={handleUpdateUser} settings={settings} onChangeSettings={setSettings} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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