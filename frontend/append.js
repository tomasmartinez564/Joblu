const fs = require('fs');
const css = `
/* ============================================================
   USER PROFILE POPUP (Community)
   ============================================================ */
.profile-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.profile-popup-content {
  background: var(--joblu-surface);
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--joblu-border-soft);
  border-top: 4px solid var(--joblu-primary-accent);
  overflow: hidden;
  animation: popupSlideUp 0.3s ease-out;
}

@keyframes popupSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-popup-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--joblu-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 10;
}

.profile-popup-close:hover {
  color: var(--joblu-text-main);
}

.profile-popup-loading,
.profile-popup-error {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--joblu-text-muted);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.profile-popup-header {
  padding: 2.5rem 1.5rem 1.5rem;
  text-align: center;
  border-bottom: 1px solid var(--joblu-border-soft);
  background: linear-gradient(180deg, rgba(33, 219, 210, 0.05) 0%, rgba(255,255,255,0) 100%);
}

.profile-popup-avatar,
.profile-popup-avatar-placeholder {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(99, 55, 183, 0.15);
}

.profile-popup-avatar-placeholder {
  color: var(--joblu-border-soft);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.profile-popup-name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--joblu-text-main);
  font-family: var(--font-subtitle);
}

.profile-popup-preferences {
  padding: 1.5rem;
  background: #f8fafc;
}

.preferences-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--joblu-primary);
  margin: 0 0 1rem;
  font-weight: 700;
}

.preferences-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.preferences-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--joblu-border-soft);
  box-shadow: var(--joblu-shadow-sm);
}

.preference-icon {
  color: var(--joblu-primary-accent);
  font-size: 1.1rem;
}

.preference-detail {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.preference-label {
  font-size: 0.7rem;
  color: var(--joblu-text-muted);
  text-transform: uppercase;
  font-weight: 700;
}

.preference-value {
  font-weight: 600;
  color: var(--joblu-text-main);
  font-size: 0.9rem;
}

.no-preferences-msg {
  font-size: 0.9rem;
  color: var(--joblu-text-muted);
  font-style: italic;
  text-align: center;
  margin: 0;
}
`;
fs.appendFileSync('./src/styles/community.css', css, 'utf8');
console.log("CSS appended successfully.");
