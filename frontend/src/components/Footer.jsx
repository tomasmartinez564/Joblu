import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <Link to="/" className="footer-logo">
                        Joblu
                    </Link>
                    <p className="footer-description">
                        La plataforma inteligente para potenciar tu carrera profesional.
                        Crea tu CV, encuentra empleo y conecta con la comunidad.
                    </p>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Navegación</h4>
                    <div className="footer-links">
                        <Link to="/" className="footer-link">Inicio</Link>
                        <Link to="/cv" className="footer-link">Crear CV</Link>
                        <Link to="/jobs" className="footer-link">Bolsa de Trabajo</Link>
                        <Link to="/comunidad" className="footer-link">Comunidad</Link>
                    </div>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Legal</h4>
                    <div className="footer-links">
                        <Link to="#" className="footer-link">Términos y Condiciones</Link>
                        <Link to="#" className="footer-link">Política de Privacidad</Link>
                        <Link to="#" className="footer-link">Cookies</Link>
                    </div>
                </div>

                <div className="footer-section">
                    <h4 className="footer-title">Síguenos</h4>
                    <div className="footer-socials">
                        {/* Using text/emojis as placeholders for icons if libraries aren't available, 
                or simple styled divs. For now simple placeholders. */}
                        <a href="#" className="social-icon" aria-label="Facebook">F</a>
                        <a href="#" className="social-icon" aria-label="Twitter">X</a>
                        <a href="#" className="social-icon" aria-label="Instagram">I</a>
                        <a href="#" className="social-icon" aria-label="LinkedIn">L</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Joblu. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
