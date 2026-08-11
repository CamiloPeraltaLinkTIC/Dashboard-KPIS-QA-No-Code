'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DashboardDataProvider } from '@/contexts/DashboardDataContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <div className="dashboard-layout">
        {/* Fondo ambiental compartido con el login */}
        <div className="ambient-bg" aria-hidden="true">
          <div className="ambient-aurora ambient-aurora-1" />
          <div className="ambient-aurora ambient-aurora-2" />
          <div className="ambient-grid" />
          <div className="ambient-grain" />
        </div>

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="main-content">
          <Header />

          <div className="tab-viewport">
            {children}
          </div>
        </main>

        <style jsx>{`
          .dashboard-layout {
            display: flex;
            min-height: 100vh;
          }

          .main-content {
            margin-left: 260px;
            flex: 1;
            padding: 24px 32px 40px 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: calc(100% - 260px);
          }

          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              width: 100%;
              padding: 16px;
            }
          }

          .tab-viewport {
            flex: 1;
          }
        `}</style>
      </div>
    </DashboardDataProvider>
  );
}
