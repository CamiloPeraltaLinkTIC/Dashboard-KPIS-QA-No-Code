'use client';

import React, { useEffect, useState } from 'react';

interface AuthTransitionProps {
  type: 'login' | 'logout';
  onDone: () => void;
}

export default function AuthTransition({ type, onDone }: AuthTransitionProps) {
  const [exiting, setExiting] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      onDone();
      return;
    }

    const exitTimer = setTimeout(() => setExiting(true), 650);
    const doneTimer = setTimeout(() => onDone(), 950);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
    // Se ejecuta una sola vez al montar: es una transición de un solo uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (prefersReducedMotion) return null;

  const isLogin = type === 'login';

  return (
    <div className={`auth-transition ${exiting ? 'exiting' : ''}`} aria-hidden="true">
      <div className="transition-aurora aurora-1" />
      <div className="transition-aurora aurora-2" />
      <div className="transition-grid" />

      <div className="transition-content">
        <div className={`transition-badge ${isLogin ? 'badge-login' : 'badge-logout'}`}>
          <span className="badge-ring" />
          {isLogin ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                className="badge-check-path"
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset="24"
              />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </div>

        <h2 className="transition-title">
          {isLogin ? '¡Acceso concedido!' : 'Cerrando sesión…'}
        </h2>
        <p className="transition-subtitle">
          {isLogin ? 'Cargando tu panel de control...' : 'Hasta pronto'}
        </p>
      </div>

      <style jsx>{`
        .auth-transition {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app);
          overflow: hidden;
          animation: overlayIn 0.2s ease-out forwards;
        }

        .auth-transition.exiting {
          animation: overlayOut 0.3s ease-in forwards;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes overlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .transition-aurora {
          position: absolute;
          width: 640px;
          height: 640px;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0;
          animation: auroraPulse 0.7s ease-out forwards;
        }

        .aurora-1 {
          top: 50%;
          left: 50%;
          margin: -320px 0 0 -380px;
          background: radial-gradient(circle, hsla(263, 85%, 64%, 0.4), transparent 70%);
        }

        .aurora-2 {
          top: 50%;
          left: 50%;
          margin: -280px 0 0 -260px;
          background: radial-gradient(circle, hsla(190, 90%, 50%, 0.35), transparent 70%);
          animation-delay: 0.08s;
        }

        @keyframes auroraPulse {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        .transition-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(circle at 50% 45%, black, transparent 70%);
          opacity: 0.5;
        }

        .transition-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .transition-badge {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          opacity: 0;
          animation: badgePopIn 0.45s 0.12s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .badge-login {
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: 0 0 40px hsla(263, 85%, 64%, 0.5);
        }

        .badge-logout {
          background: linear-gradient(135deg, var(--color-danger), hsl(20, 85%, 55%));
          box-shadow: 0 0 40px hsla(347, 85%, 55%, 0.4);
        }

        @keyframes badgePopIn {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        .badge-check-path {
          animation: drawCheck 0.35s 0.48s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        .badge-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          opacity: 0;
          animation: ringPulse 0.7s 0.18s ease-out forwards;
        }

        .badge-logout .badge-ring {
          border-color: var(--color-danger);
        }

        @keyframes ringPulse {
          from { transform: scale(0.8); opacity: 0.6; }
          to { transform: scale(1.7); opacity: 0; }
        }

        .transition-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          opacity: 0;
          animation: textIn 0.4s 0.32s ease-out forwards;
        }

        .transition-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 6px;
          opacity: 0;
          animation: textIn 0.4s 0.4s ease-out forwards;
        }

        @keyframes textIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
