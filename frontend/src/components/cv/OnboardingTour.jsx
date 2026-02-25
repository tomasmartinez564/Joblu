import { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/tour.css";

// ============================================================
// 🎓 ONBOARDING TOUR — CvBuilder JOBLU  (v2, fixed)
// ============================================================
//
// localStorage key: "joblu_cv_onboarding_v2"
//
// Dev reset (paste in browser console):
//   window.resetCvOnboarding()
// ============================================================

export const LS_KEY = "joblu_cv_onboarding_v2";

// ── Pasos del tour ────────────────────────────────────────────
const TOUR_STEPS = [
    {
        target: null,
        title: "¡Bienvenido al creador de CV! 🎉",
        body: "En unos pocos pasos te vamos a guiar por todas las herramientas disponibles para que puedas crear un CV impecable. ¿Arrancamos?",
        position: "center",
    },
    {
        target: "[data-tour='cv-header']",
        title: "Título y Progreso 📋",
        body: "Acá ves el nombre de la sección activa y la barra de progreso. Completá cada sección y avanzá con las flechas de navegación.",
        position: "bottom",
    },
    {
        target: "[data-tour='cv-preferences']",
        title: "Preferencias del CV ⚙️",
        body: "Configurá el idioma (Español / Inglés), el estilo de diseño y el rubro objetivo. Estos ajustes adaptan el contenido de tu CV automáticamente.",
        position: "bottom",
    },
    {
        target: "[data-tour='cv-form-fields']",
        title: "Tus datos 📝",
        body: "Completá cada campo con tu información. Podés navegar entre secciones usando las flechas ← →.",
        position: "bottom",
    },
    {
        target: "[data-tour='cv-step-navigation']",
        title: "Navegación entre secciones ◀ ▶",
        body: "Usá estas flechas para moverte entre las 8 secciones del formulario: Datos, Perfil, Experiencia, Educación y más.",
        position: "top",
    },
    {
        target: "[data-tour='cv-ai-button']",
        title: "✨ Mejorar con IA",
        body: "JOBLU tiene integración con inteligencia artificial. Hace tu texto más profesional y lo adapta al puesto al que aplicás.",
        position: "top",
    },
    {
        target: "[data-tour='cv-save-actions']",
        title: "Guardar y Descargar 💾",
        body: "Guardá tu CV en la nube o descargalo directamente en formato PDF listo para enviar.",
        position: "top",
    },
    {
        target: "[data-tour='cv-preview']",
        title: "Vista Previa en Tiempo Real 👁️",
        body: "Cada cambio que hacés en el formulario se refleja aquí al instante. Ves exactamente cómo queda antes de descargarlo.",
        position: "left",
    },
    {
        target: "[data-tour='cv-template-button']",
        title: "🎨 Cambiar Plantilla",
        body: "JOBLU ofrece múltiples plantillas: Profesional ATS, Moderna y Minimalista. Elegí la que mejor represente tu perfil.",
        position: "bottom",
    },
    {
        target: "[data-tour='cv-ai-button']",
        title: "Pro tip: IA + Oferta Laboral 🤖",
        body: "Pegá la descripción de un puesto al que apliques y la IA adaptará tu perfil usando las palabras clave exactas de esa oferta.",
        position: "top",
    },
    {
        target: null,
        title: "¡Todo listo! 🚀",
        body: "Ya conocés todas las herramientas. ¡Completá tu CV, mejoralo con IA y descargalo. El trabajo de tus sueños está más cerca!",
        position: "center",
    },
];

// ── Posicionamiento inteligente del tooltip ───────────────────
//
// El tooltip NUNCA debe tapar el elemento resaltado.
// Orden de intento: preferido → bottom → top → right → left → center.
//
const EDGE = 16;       // margen mínimo al borde del viewport
const GAP = 16;       // distancia entre target y tooltip

function bestPosition(rect, preferred, tooltipW, tooltipH) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fits = {
        bottom: rect.bottom + GAP + tooltipH <= vh - EDGE,
        top: rect.top - GAP - tooltipH >= EDGE,
        right: rect.right + GAP + tooltipW <= vw - EDGE,
        left: rect.left - GAP - tooltipW >= EDGE,
    };

    // Try preferred first, then cycle through alternatives
    const order = [preferred, "bottom", "top", "right", "left"];
    const seen = new Set();
    for (const pos of order) {
        if (!seen.has(pos) && fits[pos]) return pos;
        seen.add(pos);
    }
    return "center"; // last resort — centered modal
}

function tooltipCoords(rect, position, tooltipW, tooltipH) {
    if (!rect || position === "center") return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    switch (position) {
        case "bottom":
            top = rect.bottom + GAP;
            left = rect.left + rect.width / 2 - tooltipW / 2;
            break;
        case "top":
            top = rect.top - GAP - tooltipH;
            left = rect.left + rect.width / 2 - tooltipW / 2;
            break;
        case "left":
            top = rect.top + rect.height / 2 - tooltipH / 2;
            left = rect.left - GAP - tooltipW;
            break;
        case "right":
            top = rect.top + rect.height / 2 - tooltipH / 2;
            left = rect.right + GAP;
            break;
        default:
            return null;
    }

    // Clamp to viewport edges
    left = Math.max(EDGE, Math.min(left, vw - tooltipW - EDGE));
    top = Math.max(EDGE, Math.min(top, vh - tooltipH - EDGE));

    return { top, left };
}

// ── Componente ────────────────────────────────────────────────
export default function OnboardingTour({ active, onClose }) {
    const [step, setStep] = useState(0);
    const [tooltipPos, setTooltipPos] = useState(null);
    const [spotlight, setSpotlight] = useState(null); // { top, left, width, height }
    const [resolvedPos, setResolvedPos] = useState("center");

    // Refs
    const timerRef = useRef(null);
    const tooltipRef = useRef(null);
    const btnPrimaryRef = useRef(null);
    const totalSteps = TOUR_STEPS.length;
    const current = TOUR_STEPS[step];
    const isLast = step === totalSteps - 1;
    const isCentered = resolvedPos === "center";

    // ── Core: calculate spotlight + tooltip for a given step ──
    const positionStep = useCallback((stepIdx) => {
        clearTimeout(timerRef.current);
        const s = TOUR_STEPS[stepIdx];

        if (!s.target) {
            setSpotlight(null);
            setTooltipPos(null);
            setResolvedPos("center");
            return;
        }

        const el = document.querySelector(s.target);
        if (el) {
            // Smooth scroll first — tooltip calc happens after
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            // Target no existe, fallback robusto
            setSpotlight(null);
            setTooltipPos(null);
            setResolvedPos("center");
            return;
        }

        // Wait for scroll to finish before measuring
        timerRef.current = setTimeout(() => {
            const el2 = document.querySelector(s.target);
            if (!el2) { setSpotlight(null); setTooltipPos(null); setResolvedPos("center"); return; }

            const rect = el2.getBoundingClientRect();

            // Spotlight: 10px padding all around
            const PAD = 10;
            setSpotlight({
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
            });

            // Get real tooltip dimensions
            let tWidth = 320;
            let tHeight = 200;
            if (tooltipRef.current) {
                const tRect = tooltipRef.current.getBoundingClientRect();
                if (tRect.width > 0) tWidth = tRect.width;
                if (tRect.height > 0) tHeight = tRect.height;
            }

            const pos = bestPosition(rect, s.position, tWidth, tHeight);
            setResolvedPos(pos);
            setTooltipPos(tooltipCoords(rect, pos, tWidth, tHeight));
        }, 420); // give smooth scroll time to land
    }, []);

    // Re-position whenever step or active flag changes
    useEffect(() => {
        if (!active) return;
        setStep(0);

        // Wait for render to measure tooltip, then position
        setTimeout(() => positionStep(0), 0);

        return () => clearTimeout(timerRef.current);
    }, [active, positionStep]);

    useEffect(() => {
        if (!active) return;
        positionStep(step);
    }, [step, active, positionStep]);

    // Recalculate on window resize
    useEffect(() => {
        if (!active) return;
        const onResize = () => positionStep(step);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [step, active, positionStep]);

    // Focus management en cambio de step
    useEffect(() => {
        if (active && btnPrimaryRef.current) {
            // Pequeño delay para asegurar que renderizó
            setTimeout(() => btnPrimaryRef.current?.focus(), 50);
        }
    }, [step, active]);

    // Bloquear scroll global mientras el tour está activo
    useEffect(() => {
        if (!active) return;

        // Guardar estilos previos
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const originalOverscroll = document.body.style.overscrollBehavior;

        // Calcular ancho de scrollbar para evitar layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        // Aplicar bloqueo y compensar padding
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none'; // Evitar bounce en mobile
        if (scrollbarWidth > 0) {
            // Solo agregar padding si había scrollbar visible
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        // Cleanup al cerrar o desmontar
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
            document.body.style.overscrollBehavior = originalOverscroll;
        };
    }, [active]);

    // ── Handlers ─────────────────────────────────────────────
    const finish = useCallback(() => {
        localStorage.setItem(LS_KEY, "done");
        onClose();
    }, [onClose]);

    const handleNext = useCallback(() => (isLast ? finish() : setStep((s) => s + 1)), [isLast, finish]);
    const handlePrev = useCallback(() => step > 0 && setStep((s) => s - 1), [step]);
    const handleSkip = useCallback(() => finish(), [finish]);

    // Teclado (Accessibility)
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                finish();
            } else if (e.key === "ArrowRight") {
                handleNext();
            } else if (e.key === "ArrowLeft" && step > 0) {
                handlePrev();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [active, finish, handleNext, handlePrev, step]);

    if (!active) return null;

    // ── Render ───────────────────────────────────────────────
    return (
        <>
            {/*
        ── ARCHITECTURE NOTE ──
        The spotlight's box-shadow IS the dim overlay.
        box-shadow: 0 0 0 9999px rgba(...) punches a hole in the darkness
        and dims everything outside. Adding a separate backdrop background
        would cause DOUBLE darkening. The backdrop div just provides z-index
        stacking context — it has NO background color of its own.
      */}
            <div className="tour-backdrop" aria-hidden="true" />

            {/* Spotlight frame — creates the visible "cut-out" hole */}
            {spotlight && (
                <div
                    className="tour-spotlight"
                    style={{
                        top: spotlight.top,
                        left: spotlight.left,
                        width: spotlight.width,
                        height: spotlight.height,
                    }}
                />
            )}

            {/* Tooltip card */}
            <div
                ref={tooltipRef}
                className={`tour-tooltip${isCentered ? " tour-tooltip--center" : ""}`}
                style={!isCentered && tooltipPos ? { top: tooltipPos.top, left: tooltipPos.left } : undefined}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-dialog-title"
                aria-describedby="tour-dialog-body"
            >
                {/* Progress dots */}
                <div className="tour-dots" aria-hidden="true">
                    {TOUR_STEPS.map((_, i) => (
                        <span key={i} className={`tour-dot${i === step ? " tour-dot--active" : ""}`} />
                    ))}
                </div>

                <p className="tour-step-label">Paso {step + 1} de {totalSteps}</p>
                <h3 id="tour-dialog-title" className="tour-title">{current.title}</h3>
                <p id="tour-dialog-body" className="tour-body">{current.body}</p>

                <div className="tour-actions">
                    <button className="tour-btn-skip" onClick={handleSkip}>Omitir tour</button>
                    <div className="tour-nav-btns">
                        {step >= 1 && (
                            <button className="tour-btn-secondary" onClick={handlePrev}>← Atrás</button>
                        )}
                        <button ref={btnPrimaryRef} className="tour-btn-primary" onClick={handleNext}>
                            {isLast ? "¡Empezar! 🚀" : "Siguiente →"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Programmatic re-launch ────────────────────────────────────
export function startCvOnboardingTour() {
    localStorage.removeItem(LS_KEY);
    window.dispatchEvent(new CustomEvent("joblu:start-tour"));
}

// ── Dev helper (available in browser console) ─────────────────
window.resetCvOnboarding = () => {
    localStorage.removeItem(LS_KEY);
    console.log("[JOBLU] Onboarding reset. Reloading...");
    window.location.reload();
};
