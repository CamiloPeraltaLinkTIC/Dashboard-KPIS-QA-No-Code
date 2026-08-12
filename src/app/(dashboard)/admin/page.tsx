'use client';

import React from 'react';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/components/AuthProvider';

export default function AdminPage() {
  const { profile } = useAuth();
  const hasAdminAccess = !!profile?.is_admin || profile?.role === 'admin' || profile?.role === 'Administrator';

  return (
    <div className="view-pane animate-fade-in">
      {hasAdminAccess ? (
        <AdminPanel />
      ) : (
        <div className="access-denied glass">
          <h2>Acceso restringido</h2>
          <p>No tienes permisos de administrador para ver esta sección.</p>
        </div>
      )}

      <style jsx>{`
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .access-denied {
          padding: 48px 32px;
          text-align: center;
          border-radius: var(--radius-md);
        }

        .access-denied h2 {
          margin: 0 0 8px;
          color: var(--text-primary);
        }

        .access-denied p {
          margin: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
