import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// ── Dev helper (available in browser console) ─────────────────
window.resetCvOnboarding = () => {
  localStorage.removeItem("joblu_cv_onboarding_v2");
  console.log("[JOBLU] Onboarding reset. Reloading...");
  setTimeout(() => window.location.reload(), 100);
};
