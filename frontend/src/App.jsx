import { useState, useEffect } from 'react'
import { NavLink, Route, Routes, useNavigate, Link } from 'react-router-dom'
import './App.css'

// Páginas
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

// Estilos globales de componentes
import "./styles/header.css";
import "./styles/footer.css";

// Componentes
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Contexto (NUEVO IMPORT)
import { ToastProvider, useToast } from './context/ToastContext';
import API_BASE_URL from './config/api';


const handleLogin = (userData, token) => {
  // Guardamos el usuario en el estado
  setUser(userData)
  setIsAccountMenuOpen(false)

  // Guardamos token y user en localStorage para persistencia
  try {
    localStorage.setItem('joblu_token', token)
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userData)) // Actualizamos esto también

    // Chequeo de onboarding
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

  // Limpieza profunda
  localStorage.removeItem('joblu_token')
  localStorage.removeItem(LS_USER_KEY)

  navigate('/')
}

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
  darkMode: false, // Nueva preferencia
}

// ⚠️ Nota: Cambiamos el nombre de la función principal a AppLayout internamente
// para poder envolverla después.
function AppLayout() {
  const navigate = useNavigate()

  // 🧑‍💻 Usuario
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // 📄 CVs guardados (Ahora sincronizados con backend)
  const [savedCvs, setSavedCvs] = useState([]);

  // CV activo
  const [activeCvData, setActiveCvData] = useState(null)
  const [activeCvId, setActiveCvId] = useState(null) // ID para saber si es update o create

  // 💼 Empleos guardados
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SAVED_JOBS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED_JOBS_KEY, JSON.stringify(savedJobs))
    } catch { }
  }, [savedJobs])

  const toggleSavedJob = (jobId) => {
    setSavedJobs((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  }

  // ⚙️ Preferencias
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

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  // 💾 Effects para localStorage
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
      // Aplicar clase dark-mode al body
      if (settings.darkMode) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
    } catch { }
  }, [settings])

  // 📡 Efecto para cargar CVs desde Backend al iniciar o loguearse
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('joblu_token');
      if (!token) return;

      fetch(`${API_BASE_URL}/api/cvs`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Error fetching CVs");
        })
        .then(data => setSavedCvs(data))
        .catch(err => console.error("Error cargando CVs:", err));
    } else {
      setSavedCvs([]);
    }
  }, [user]);

  // Handlers
  const handleLogin = (userData, token) => {
    // setUser(userData) -> esto estaba incompleto antes
    // userData viene del backend como { name, email, id }
    setUser(userData)
    setIsAccountMenuOpen(false)

    try {
      if (token) {
        localStorage.setItem('joblu_token', token)
      }
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
    setSavedCvs([])
    setActiveCvData(null)
    setActiveCvId(null)
    setIsAccountMenuOpen(false)
    setShowOnboarding(false)
    navigate('/')
  }

  const handleSaveCv = async (cvData) => {
    const token = localStorage.getItem('joblu_token');
    if (!user || !token) {
      alert("Iniciá sesión para guardar tu CV en la nube.");
      return;
    }

    const title = cvData.nombre || 'CV sin nombre';
    const puesto = cvData.puesto || '';

    try {
      let method = 'POST';
      let url = `${API_BASE_URL}/api/cvs`;

      // Si tenemos un ID activo, es una ACTUALIZACIÓN (PUT)
      if (activeCvId) {
        method = 'PUT';
        url = `${API_BASE_URL}/api/cvs/${activeCvId}`;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, puesto, data: cvData })
      });

      if (res.ok) {
        const savedCv = await res.json();

        if (method === 'POST') {
          // Si es nuevo, lo agregamos y lo marcamos como activo
          setSavedCvs(prev => [savedCv, ...prev]);
          setActiveCvId(savedCv._id); // Para que el próximo save sea update
        } else {
          // Si es update, actualizamos la lista
          setSavedCvs(prev => prev.map(cv => cv._id === savedCv._id ? savedCv : cv));
        }

        // Feedback visual simple (opcional, o usar toast si existiera)
        console.log("CV guardado correctamente");
        return true; // Retornamos éxito para el UI
      }
    } catch (err) {
      console.error("Error guardando CV:", err);
    }
    return false;
  }

  const handleOpenCv = (id) => {
    const found = savedCvs.find((cv) => cv.id === id || cv._id === id)
    if (!found) return
    setActiveCvData(found.data)
    setActiveCvId(found._id || found.id) // Guardamos el ID para saber que estamos editando ESTE
    navigate('/cv')
  }

  const handleDeleteCv = async (id) => {
    const token = localStorage.getItem('joblu_token');
    if (!token) return;

    // Optimistic update
    setSavedCvs((prev) => prev.filter((cv) => cv.id !== id && cv._id !== id));

    try {
      await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Error borrando CV:", err);
      // Rollback si falla (opcional)
    }
  }

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

  // Onboarding Logic
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

  const handleCreateCv = () => {
    setActiveCvData(null);
    setActiveCvId(null);
    navigate('/cv');
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
        onCreateCv={handleCreateCv} // Pasamos el handler
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
          <Route path="/" element={<Home user={user} savedCvs={savedCvs} onOpenCv={handleOpenCv} />} />
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
          <Route path="/jobs" element={<Jobs savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
          <Route path="/jobs/:id" element={<JobDetail savedJobs={savedJobs} toggleSavedJob={toggleSavedJob} />} />
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
                settings={settings}
                onChangeSettings={setSettings}
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

// =========================================================
// AQUÍ ESTÁ EL CAMBIO IMPORTANTE:
// Creamos un componente "App" que envuelve a "AppLayout" con el Provider
// =========================================================

function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  )
}

export default App