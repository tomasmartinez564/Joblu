import { Link, NavLink } from "react-router-dom";

export default function Navbar({
  user,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAccountMenuOpen,
  setIsAccountMenuOpen,
  navigate,
  handleLogout,
  goToAccount,
  onCreateCv, // Recibimos el handler
}) {
  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        <img src="/logo2.png" alt="Joblu" className="app-logo-img" />
      </Link>

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
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </button>

            <div className={`account-menu ${isAccountMenuOpen ? "open" : ""}`}>
              <button
                type="button"
                className="account-menu-item"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  navigate("/configuracion");
                }}
              >
                Configuración
              </button>

              <button
                type="button"
                className="account-menu-item"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  handleLogout();
                }}
              >
                Cerrar sesión
              </button>

              <button
                type="button"
                className="account-menu-item"
                onClick={() => {
                  goToAccount();
                }}
              >
                Mi cuenta
              </button>
            </div>
          </div>
        )}
      </div>

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

            <button
              type="button"
              className="drawer-user"
              onClick={() => {
                setIsMobileMenuOpen(false);
                goToAccount();
              }}
            >
              <div className="drawer-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
              <div className="drawer-user-info">
                <p className="drawer-username">{user.name}</p>
                <p className="drawer-email">{user.email}</p>
              </div>
            </button>

            <nav className="drawer-nav" onClick={() => setIsMobileMenuOpen(false)}>

              <NavLink
                to="/"
                className={({ isActive }) =>
                  "drawer-link" + (isActive ? " drawer-link-active" : "")
                }
              >
                Inicio
              </NavLink>

              <NavLink
                to="/cv"
                className={({ isActive }) =>
                  "drawer-link" + (isActive ? " drawer-link-active" : "")
                }
                onClick={(e) => {
                  if (onCreateCv) {
                    e.preventDefault();
                    onCreateCv();
                    setIsMobileMenuOpen(false); // Cerramos menú móvil también
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                Crear CV
              </NavLink>

              <NavLink
                to="/comunidad"
                className={({ isActive }) =>
                  "drawer-link" + (isActive ? " drawer-link-active" : "")
                }
              >
                Comunidad
              </NavLink>

              <NavLink
                to="/jobs"
                className={({ isActive }) =>
                  "drawer-link" + (isActive ? " drawer-link-active" : "")
                }
              >
                Bolsa de Trabajo
              </NavLink>

              <NavLink
                to="/mis-cvs"
                className={({ isActive }) =>
                  "drawer-link" + (isActive ? " drawer-link-active" : "")
                }
              >
                Mis cvs
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
