'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/authErrors';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase devuelve los errores de OAuth (login cancelado, cuenta fuera del
  // dominio permitido, etc.) en el hash de la URL al volver de Google.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    const params = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = params.get('error_description') || params.get('error');
    if (errorDescription) {
      setError(translateAuthError(decodeURIComponent(errorDescription).replace(/\+/g, ' ')));
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      // No hace falta setLoading(false): la página redirige a Google.
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : undefined));
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Fondo decorativo: aurora + grilla de píxeles + KPIs reales flotando */}
      <div className="bg-decor" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="pixel-grid" />
        <div className="ambient-grain" />

        <div className="stat-chip chip-1">
          <div className="chip-inner inspect-corners">
            <span className="chip-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <div className="chip-text">
              <span className="chip-label">Píxel Perfecto</span>
              <span className="chip-value">99%</span>
            </div>
          </div>
        </div>

        <div className="stat-chip chip-2">
          <div className="chip-inner inspect-corners">
            <span className="chip-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <div className="chip-text">
              <span className="chip-label">Cumplimiento DoD</span>
              <span className="chip-value">100%</span>
            </div>
          </div>
        </div>

        <div className="stat-chip chip-3">
          <div className="chip-inner inspect-corners">
            <span className="chip-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z" />
              </svg>
            </span>
            <div className="chip-text">
              <span className="chip-label">Calidad Visual</span>
              <span className="chip-value">97%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-card glass">
        <div className="login-header">
          <div className="brand-badge">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                className="check-path"
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset="24"
              />
            </svg>
          </div>

          <span className="eyebrow">Control de Calidad · No-Code</span>
          <h2>NoCode<span className="text-gradient">QA</span></h2>
          <p>Inicia sesión con tu cuenta de Google corporativa</p>
        </div>

        <div className="login-form">
          {error && <div className="error-message">{error}</div>}

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-primary">
            {loading ? (
              <span className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#FFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#FFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FFF" d="M5.84 14.09A6.96 6.96 0 0 1 5.48 12c0-.73.13-1.43.36-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#FFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{loading ? 'Redirigiendo a Google...' : 'Iniciar sesión con Google'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-app);
          padding: 20px;
          overflow: hidden;
        }

        /* ---------- Fondo decorativo ---------- */
        .bg-decor {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .aurora {
          position: absolute;
          width: 560px;
          height: 560px;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.55;
        }

        .aurora-1 {
          top: -12%;
          left: -8%;
          background: radial-gradient(circle, hsla(263, 85%, 64%, 0.55), transparent 70%);
          animation: auroraDrift1 22s ease-in-out infinite;
        }

        .aurora-2 {
          bottom: -16%;
          right: -10%;
          background: radial-gradient(circle, hsla(190, 90%, 50%, 0.5), transparent 70%);
          animation: auroraDrift2 26s ease-in-out infinite;
        }

        .pixel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(circle at 50% 40%, black, transparent 75%);
          opacity: 0.5;
        }

        /* ---------- Chips flotantes con KPIs reales ---------- */
        .stat-chip {
          position: absolute;
          opacity: 0;
          animation: chipIn 0.7s ease-out forwards;
        }

        .chip-1 { top: 16%; left: 10%; animation-delay: 0.5s; }
        .chip-2 { top: 20%; right: 9%; animation-delay: 0.68s; }
        .chip-3 { bottom: 16%; left: 15%; animation-delay: 0.86s; }

        @media (max-width: 1120px) {
          .stat-chip { display: none; }
        }

        .chip-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background: var(--bg-card);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          animation: chipFloat 5s ease-in-out infinite;
          animation-delay: 1.2s;
        }

        .chip-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
        }

        .chip-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .chip-label {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .chip-value {
          font-family: var(--font-mono);
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-success);
        }

        /* ---------- Tarjeta ---------- */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          opacity: 0;
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-badge {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          opacity: 0;
          transform: scale(0.5) rotate(-12deg);
          animation:
            badgeIn 0.5s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            badgePulse 3s 0.7s ease-in-out infinite;
        }

        .check-path {
          animation: drawCheck 0.5s 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        .eyebrow {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-secondary);
          background: var(--color-primary-glow);
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .login-header h2 {
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form > * {
          opacity: 0;
          animation: fieldIn 0.5s ease-out forwards;
        }

        .login-form > *:nth-child(1) { animation-delay: 0.35s; }
        .login-form > *:nth-child(2) { animation-delay: 0.42s; }

        .btn-primary {
          margin-top: 10px;
          padding: 14px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          box-shadow: 0 4px 16px hsla(263, 85%, 64%, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px hsla(263, 85%, 64%, 0.4);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
        }

        .error-message {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
          font-size: 0.85rem;
          border: 1px solid rgba(244, 63, 94, 0.2);
          text-align: center;
        }

        .glass {
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
        }

        /* ---------- Keyframes ---------- */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes badgeIn {
          from { opacity: 0; transform: scale(0.5) rotate(-12deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 hsla(263, 85%, 64%, 0.3), 0 0 24px 2px hsla(190, 90%, 50%, 0.2); }
          50% { box-shadow: 0 0 0 8px hsla(263, 85%, 64%, 0), 0 0 32px 6px hsla(190, 90%, 50%, 0.3); }
        }

        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        @keyframes chipIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes chipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes auroraDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(6%, 8%) scale(1.15); }
        }

        @keyframes auroraDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-6%, -8%) scale(1.1); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora,
          .stat-chip,
          .chip-inner,
          .brand-badge,
          .check-path,
          .login-card,
          .login-form > * {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .check-path {
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
