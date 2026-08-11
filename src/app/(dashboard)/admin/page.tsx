'use client';

import React from 'react';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <div className="view-pane animate-fade-in">
      <AdminPanel />

      <style jsx>{`
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
