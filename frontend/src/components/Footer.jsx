import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <Link to="/" className="footer-logo">
                        JOBLU
                    </Link>
                    <p className="footer-description">
                        La plataforma inteligente para potenciar tu carrera profesional con JOBLU.
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
                        <a href="#" className="social-icon" aria-label="Facebook"><FaFacebook /></a>
                        <a href="#" className="social-icon" aria-label="Twitter"><FaTwitter /></a>
                        <a href="#" className="social-icon" aria-label="Instagram"><FaInstagram /></a>
                        <a href="#" className="social-icon" aria-label="LinkedIn"><FaLinkedin /></a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} JOBLU. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
