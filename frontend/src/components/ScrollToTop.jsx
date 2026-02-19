import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ==========================================
// 📜 COMPONENTE: SCROLL TO TOP
// ==========================================
/**
 * Componente de utilidad que resetea la posición del scroll
 * al inicio de la página cada vez que cambia la ruta.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll suave al inicio cuando cambia la ruta
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'instant' para que sea inmediato, 'smooth' para animación
    });
  }, [pathname]);

  // Este componente no renderiza nada
  return null;
}

export default ScrollToTop;
