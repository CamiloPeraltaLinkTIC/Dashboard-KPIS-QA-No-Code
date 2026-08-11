'use client';

import React, { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error en el panel:', error);
  }, [error]);

  return (
    <div className="error-pane glass">
      <div className="error-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h3>Algo salió mal en esta sección</h3>
      <p>No se pudo cargar la información. Puedes intentar de nuevo sin perder tu sesión.</p>
      <button type="button" className="retry-btn" onClick={() => reset()}>
        Reintentar
      </button>

      <style jsx>{`
        .error-pane {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-align: center;
          min-height: 320px;
          padding: 40px 24px;
          border-radius: var(--radius-md);
        }

        .error-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsla(var(--hue-danger), 85%, 55%, 0.12);
          color: var(--color-danger);
          margin-bottom: 6px;
        }

        .error-pane h3 {
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .error-pane p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 380px;
        }

        .retry-btn {
          margin-top: 10px;
          padding: 10px 22px;
          border-radius: var(--radius-sm);
          border: none;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .retry-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
