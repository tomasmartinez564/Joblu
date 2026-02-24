import { Link, NavLink } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import UserAvatar from "./common/UserAvatar";

// ==========================================
// 🧭 COMPONENTE: NAVBAR
// ==========================================
export default function Navbar({
  user,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAccountMenuOpen,
  setIsAccountMenuOpen,
  navigate,
  handleLogout,
  goToAccount,
  onCreateCv,
}) {
  return (
    <header className="app-header">
      {/* --- 1. Logotipo --- */}
      <Link to="/" className="app-logo">
        <img src="/LOGOTIPO_celeste.png" alt="JOBLU" className="app-logo-img" fetchPriority="high" />
      </Link>

      {/* --- 2. Navegación Desktop --- */}
      <nav className="nav nav-desktop">
        <NavLink
          to="/"
          end
          className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
        >
          Inicio
        </NavLink>

        <NavLink
          to="/cv"
          className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
          onClick={(e) => {
            if (onCreateCv) {
              e.preventDefault();
              onCreateCv();
            }
          }}
        >
          Crear CV
        </NavLink>

        <NavLink
          to="/comunidad"
          className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
        >
          Comunidad
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
        >
          Bolsa de trabajo
        </NavLink>

        {user && (
          <NavLink
            to="/mis-cvs"
            className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
          >
            Mis CVs
          </NavLink>
        )}
      </nav>

      {/* --- 3. Toggle Menú Móvil (Solo si hay usuario) --- */}
      {user && !isMobileMenuOpen && (
        <button
          className="mobile-menu-toggle"
          onClick={() => {
            setIsAccountMenuOpen(false);
            setIsMobileMenuOpen(true);
          }}
        >
          ☰
        </button>
      )}

      {/* --- 4. Área de Usuario (Login o Menú de Cuenta) --- */}
      <div className="app-user-area">
        {!user && (
          <NavLink
            to="/login"
            className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
          >
            Iniciar sesión
          </NavLink>
        )}

        {user && (
          <div className="desktop-user-menu">
            <button
              type="button"
              className="account-avatar-button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              style={{ padding: 0 }}
            >
              <UserAvatar
                src={user.avatar}
                name={user.name}
                className="nav-avatar-img"
              />
            </button>

            {/* Menú Desplegable Desktop */}
            <div className={`account-menu ${isAccountMenuOpen ? "open" : ""}`}>
              <div className="account-menu-header">
                <p className="account-menu-name">{user.name}</p>
                <p className="account-menu-email">{user.email}</p>
              </div>
              <hr className="account-menu-divider" />

              <button
                type="button"
                className="account-menu-item"
                onClick={() => {
                  goToAccount();
                }}
              >
                <FaUser className="account-menu-icon" /> Mi cuenta
              </button>

              <button
                type="button"
                className="account-menu-item account-menu-logout"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  handleLogout();
                }}
              >
                <FaSignOutAlt className="account-menu-icon" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 5. Navegación Móvil (Backdrop y Drawer) --- */}
      {user && (
        <>
          <div
            className={`mobile-backdrop ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}>
            <button className="drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
              ✕
            </button>

            {/* Info de Usuario en Drawer */}
            <button
              type="button"
              className="drawer-user"
              onClick={() => {
                setIsMobileMenuOpen(false);
                goToAccount();
              }}
            >
              <div className="drawer-avatar">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  className="nav-avatar-img"
                />
              </div>
              <div className="drawer-user-info">
                <p className="drawer-username">{user.name}</p>
                <p className="drawer-email">{user.email}</p>
              </div>
            </button>

            {/* Enlaces del Drawer */}
            <nav className="drawer-nav" onClick={() => setIsMobileMenuOpen(false)}>
              <NavLink
                to="/"
                className={({ isActive }) => "drawer-link" + (isActive ? " drawer-link-active" : "")}
              >
                Inicio
              </NavLink>
              <NavLink
                to="/cv"
                className={({ isActive }) => "drawer-link" + (isActive ? " drawer-link-active" : "")}
                onClick={(e) => {
                  e.preventDefault();
                  onCreateCv();
                  setIsMobileMenuOpen(false);
                }}
              >
                Crear CV
              </NavLink>
              <NavLink
                to="/comunidad"
                className={({ isActive }) => "drawer-link" + (isActive ? " drawer-link-active" : "")}
              >
                Comunidad
              </NavLink>
              <NavLink
                to="/jobs"
                className={({ isActive }) => "drawer-link" + (isActive ? " drawer-link-active" : "")}
              >
                Bolsa de trabajo
              </NavLink>
              <NavLink
                to="/mis-cvs"
                className={({ isActive }) => "drawer-link" + (isActive ? " drawer-link-active" : "")}
              >
                Mis CVs
              </NavLink>
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
  );
}