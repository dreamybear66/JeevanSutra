import { useEffect, useRef } from 'react';

/**
 * Lightweight CSS-only opening animation.
 * Replaces the previous Three.js/GSAP scene which was causing
 * heavy main-thread blocking and frame drops.
 */
export default function OpeningAnimation({ onComplete }) {
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    // Total animation duration: ~3.2s then fade out 0.6s
    const timer = setTimeout(() => {
      if (!hasCalledComplete.current) {
        hasCalledComplete.current = true;
        onComplete();
      }
    }, 3800);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.overlay}>
      {/* ECG line via CSS animation */}
      <svg style={styles.ecgSvg} viewBox="0 0 800 120" preserveAspectRatio="none">
        <polyline
          points="0,60 80,60 100,60 120,15 140,105 160,30 180,90 200,60 280,60 300,60 320,15 340,105 360,30 380,90 400,60 480,60 500,60 520,15 540,105 560,30 580,90 600,60 680,60 700,60 720,15 740,105 760,30 780,90 800,60"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={styles.ecgLine}
        />
      </svg>

      {/* Center brand */}
      <div style={styles.centerContent}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#og1)" />
            <path
              d="M5 18h5.5l2-7 3.5 14 3.5-12 2 5H27"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="og1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0d47a1" />
                <stop offset="1" stopColor="#1976d2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={styles.title}>JeevanSutra</h1>
        <p style={styles.subtitle}>ICU Diagnostic Risk Assistant</p>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={styles.progressFill} />
        </div>

        <p style={styles.statusText}>Initializing Engine…</p>
      </div>

      <style>{`
        @keyframes ecgDraw {
          from { stroke-dashoffset: 2400; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes overlayFade {
          0%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(circle at 50% 40%, #1e293b 0%, #020617 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    zIndex: 9999,
    animation: 'overlayFade 3.8s ease forwards',
    overflow: 'hidden',
  },
  ecgSvg: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '100%',
    height: '120px',
    transform: 'translateY(-50%)',
    opacity: 0.18,
  },
  ecgLine: {
    strokeDasharray: 2400,
    strokeDashoffset: 2400,
    animation: 'ecgDraw 2.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards',
  },
  centerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    position: 'relative',
    zIndex: 2,
    animation: 'fadeUp 0.6s ease 0.1s both',
  },
  logoWrap: {
    marginBottom: '4px',
    filter: 'drop-shadow(0 0 16px rgba(14,165,233,0.5))',
  },
  title: {
    color: '#f0f9ff',
    fontSize: '2.2rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontFamily: "'Outfit', sans-serif",
    margin: 0,
  },
  subtitle: {
    color: '#7dd3fc',
    fontSize: '0.9rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
    opacity: 0.8,
  },
  progressTrack: {
    width: '220px',
    height: '3px',
    background: 'rgba(14,165,233,0.15)',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginTop: '12px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    borderRadius: '9999px',
    animation: 'barGrow 3s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
    width: 0,
  },
  statusText: {
    color: '#0ea5e9',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: "'JetBrains Mono', monospace",
    animation: 'pulse 1.5s ease-in-out infinite',
    margin: 0,
    marginTop: '4px',
  },
};
