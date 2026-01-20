import { useState, useEffect } from 'react'
import { NavLink, Route, Routes, useNavigate, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import CvBuilder from './pages/CvBuilder.jsx'
import Community from './pages/Community.jsx'
import Jobs from './pages/Jobs.jsx'
import Login from './pages/Login.jsx'
import MyCvs from './pages/MyCvs.jsx'
import Settings from './pages/Settings.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import JobDetail from './pages/JobDetail.jsx'
import PostDetail from "./pages/PostDetail";
import "./styles/header.css";
import "./styles/footer.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";




const LS_USER_KEY = 'joblu_user'
const LS_SETTINGS_KEY = 'joblu_settings'
const LS_CVS_KEY = 'joblu_savedCvs'
const LS_ONBOARDING_KEY = 'joblu_onboarding_done'

const defaultSettings = {
  cvLanguage: 'es',
  cvStyle: 'ats',
  targetIndustry: '',
  includePhoto: true,
  showTips: true,
}

function AppLayout() {
  const navigate = useNavigate()

  // 🧑‍💻 Usuario (con lectura inicial desde localStorage)
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // 📄 CVs guardados
  const [savedCvs, setSavedCvs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_CVS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // CV activo cargado desde "Mis CVs"
  const [activeCvData, setActiveCvData] = useState(null)

  // ⚙️ Preferencias del CV
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (!raw) return defaultSettings
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    } catch {
      return defaultSettings
    }
  })

  // 🔽 Menú desplegable de cuenta
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  // 💾 Guardar en localStorage cuando cambian
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
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
    } catch { }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem(LS_CVS_KEY, JSON.stringify(savedCvs))
    } catch { }
  }, [savedCvs])

  const handleLogin = ({ email }) => {
    const username = email ? email.split('@')[0] : 'Usuario'
    setUser({ email, name: username })
    setIsAccountMenuOpen(false)

    try {
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
    setSavedCvs([])
    setActiveCvData(null)
    setIsAccountMenuOpen(false)
    setShowOnboarding(false)
    navigate('/')
  }

  const handleSaveCv = (cvData) => {
    const now = new Date()
    const title = cvData.nombre || 'CV sin nombre'
    const puesto = cvData.puesto || ''
    const id = Date.now()

    const newCv = {
      id,
      title,
      puesto,
      updatedAt: now.toISOString(),
      data: cvData,
    }

    setSavedCvs((prev) => [newCv, ...prev])
  }


  const handleOpenCv = (id) => {
    const found = savedCvs.find((cv) => cv.id === id)
    if (!found) return
    setActiveCvData(found.data)
    navigate('/cv')
  }

  const handleDeleteCv = (id) => {
    setSavedCvs((prev) => prev.filter((cv) => cv.id !== id))
  }


  // 🧑‍💻 Actualizar datos del usuario (nombre, email) desde "Cuenta"
  const handleUpdateUser = (updates) => {
    if (!user) return
    setUser((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  const goToAccount = () => {
    setIsAccountMenuOpen(false)
    navigate('/cuenta')
  }

  const finishOnboarding = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem(LS_ONBOARDING_KEY, 'done')
    } catch { }
  }

  const handleNextOnboarding = () => {
    if (onboardingStep + 1 < onboardingSteps.length) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      finishOnboarding()
    }
  }


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Bienvenido a Joblu",
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


  // ----------------------------------------------------------- HEADER -----------------------------------------------------------

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
      />


      {user && showOnboarding && (
        <div className="onboarding-backdrop">
          <div className="onboarding-modal">
            <h2 className="onboarding-title">
              {onboardingSteps[onboardingStep].title}
            </h2>
            <p className="onboarding-text">
              {onboardingSteps[onboardingStep].text}
            </p>

            <div className="onboarding-actions">
              <button
                type="button"
                className="onboarding-secondary"
                onClick={finishOnboarding}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="onboarding-primary"
                onClick={handleNextOnboarding}
              >
                {onboardingStep + 1 < onboardingSteps.length
                  ? 'Siguiente'
                  : 'Empezar a usar Joblu'}
              </button>
            </div>

            <div className="onboarding-dots">
              {onboardingSteps.map((_, index) => (
                <span
                  key={index}
                  className={
                    'onboarding-dot' +
                    (index === onboardingStep ? ' onboarding-dot-active' : '')
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}


      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route
            path="/cv"
            element={
              <CvBuilder
                onSaveCv={handleSaveCv}
                initialData={activeCvData}
                user={user}
                settings={settings}
                onChangeSettings={setSettings}
              />
            }
          />


          <Route path="/comunidad" element={<Community user={user} />} />
          <Route path="/comunidad/:id" element={<PostDetail user={user} />} />

          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          <Route path="/configuracion" element={<Settings />} />

          <Route
            path="/mis-cvs"
            element={
              <MyCvs
                user={user}
                savedCvs={savedCvs}
                onOpenCv={handleOpenCv}
                onDeleteCv={handleDeleteCv}
              />
            }
          />

          <Route
            path="/cuenta"
            element={
              <AccountSettings
                user={user}
                onUpdateUser={handleUpdateUser}
              />
            }
          />

        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default AppLayout
