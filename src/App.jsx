import { useState, useEffect } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import CvBuilder from './pages/CvBuilder.jsx'
import Community from './pages/Community.jsx'
import Login from './pages/Login.jsx'
import MyCvs from './pages/MyCvs.jsx'
import Settings from './pages/Settings.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import PostDetail from "./pages/PostDetail";



const LS_USER_KEY = 'joblu_user'
const LS_THEME_KEY = 'joblu_theme'
const LS_SETTINGS_KEY = 'joblu_settings'
const LS_CVS_KEY = 'joblu_savedCvs'

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

  // 🎨 Tema de la app
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(LS_THEME_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  })

  // 🔽 Menú desplegable de cuenta
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  // Aplicar clase al body para modo oscuro
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark')
    } else {
      document.body.classList.remove('theme-dark')
    }
  }, [theme])

  // 💾 Guardar en localStorage cuando cambian
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(LS_USER_KEY)
      }
    } catch {}
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(LS_THEME_KEY, theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem(LS_CVS_KEY, JSON.stringify(savedCvs))
    } catch {}
  }, [savedCvs])

  const handleLogin = ({ email }) => {
    const username = email ? email.split('@')[0] : 'Usuario'
    setUser({ email, name: username })
    setIsAccountMenuOpen(false)
    navigate('/cv')
  }

  const handleLogout = () => {
    setUser(null)
    setSavedCvs([])
    setActiveCvData(null)
    setIsAccountMenuOpen(false)
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
    alert('CV guardado en "Mis CVs".')
  }

  const handleOpenCv = (id) => {
    const found = savedCvs.find((cv) => cv.id === id)
    if (!found) return
    setActiveCvData(found.data)
    navigate('/cv')
  }

  const handleDeleteCv = (id) => {
    if (!confirm('¿Seguro que querés eliminar este CV?')) return
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

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  const goToAccount = () => {
    setIsAccountMenuOpen(false)
    navigate('/cuenta')
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// ----------------------------------------------------------- HEADER -----------------------------------------------------------
  
return (
    <div className="app">
<header className="app-header">
  <div className="app-logo">
    Job<span>lu</span>
  </div>

  {/* NAV ESCRITORIO (se oculta en mobile por CSS) */}
  <nav className="nav nav-desktop">
    <NavLink to="/" end className={({ isActive }) =>
      'nav-link' + (isActive ? ' nav-link-active' : '')
    }>
      Inicio
    </NavLink>

    <NavLink to="/cv" className={({ isActive }) =>
      'nav-link' + (isActive ? ' nav-link-active' : '')
    }>
      Crear CV
    </NavLink>

    <NavLink to="/comunidad" className={({ isActive }) =>
      'nav-link' + (isActive ? ' nav-link-active' : '')
    }>
      Comunidad
    </NavLink>

    {user && (
      <>
        <NavLink to="/mis-cvs" className={({ isActive }) =>
          'nav-link' + (isActive ? ' nav-link-active' : '')
        }>
          Mis CVs
        </NavLink>

        <NavLink to="/config" className={({ isActive }) =>
          'nav-link' + (isActive ? ' nav-link-active' : '')
        }>
          Configuración CV
        </NavLink>
      </>
    )}
  </nav>

  {/* BOTÓN MENÚ (solo si hay usuario autenticado) */}
  {user && !isMobileMenuOpen && (
    <button
      className="mobile-menu-toggle"
      onClick={() => setIsMobileMenuOpen(true)}
    >
      ☰
    </button>
  )}



  {/* ZONA DE USUARIO (SE MANTIENE IGUAL) */}
<div className="app-user-area">
  {!user && (
    <NavLink
      to="/login"
      className={({ isActive }) =>
        'nav-link' + (isActive ? ' nav-link-active' : '')
      }
    >
      Iniciar sesión
    </NavLink>
  )}
</div>


  {user && (
    <>
      {/* BACKDROP (OSCURECE EL FONDO) */}
      <div
        className={`mobile-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* MENÚ DESLIZABLE DESDE LA DERECHA */}
      <aside className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <button
          className="drawer-close"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>

        <NavLink
          to="/cuenta"
          className="drawer-user"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="drawer-avatar">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="drawer-user-info">
            <p className="drawer-username">{user.name}</p>
            <p className="drawer-email">{user.email}</p>
          </div>
        </NavLink>

        <nav className="drawer-nav" onClick={() => setIsMobileMenuOpen(false)}>
          <NavLink to="/" className="drawer-link">Inicio</NavLink>
          <NavLink to="/cv" className="drawer-link">Crear CV</NavLink>
          <NavLink to="/comunidad" className="drawer-link">Comunidad</NavLink>
          <NavLink to="/mis-cvs" className="drawer-link">Mis CVs</NavLink>
          <NavLink to="/config" className="drawer-link">Configuración</NavLink>
        </nav>

        <button
          type="button"
          className="drawer-link drawer-link-logout"
          onClick={() => {
            setIsMobileMenuOpen(false);
            handleLogout();
          }}
        >
          Cerrar sesión
        </button>
      </aside>
    </>
  )}


</header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/cv"
            element={
              <CvBuilder
                onSaveCv={handleSaveCv}
                initialData={activeCvData}
                user={user}
                settings={settings}
                // settings={settings}  // más adelante para IA / formato
              />
            }
          />

          <Route path="/comunidad" element={<Community user={user} />} />
          <Route path="/comunidad/:id" element={<PostDetail user={user} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

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
            path="/config"
            element={
              <Settings
                user={user}
                settings={settings}
                onChangeSettings={setSettings}
              />
            }
          />

          <Route
            path="/cuenta"
            element={
              <AccountSettings
                user={user}
                onUpdateUser={handleUpdateUser}
                theme={theme}
                onChangeTheme={handleThemeChange}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default AppLayout
