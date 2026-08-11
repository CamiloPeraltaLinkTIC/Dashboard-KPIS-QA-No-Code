'use client';

export default function DashboardLoading() {
  return (
    <div className="loading-pane">
      <div className="loading-spinner" aria-hidden="true" />
      <p>Cargando...</p>

      <style jsx>{`
        .loading-pane {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 320px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid var(--border-color);
          border-top-color: var(--color-primary);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
