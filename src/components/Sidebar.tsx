'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { profile } = useAuth();
  const role = profile?.role || 'QA';

  const allMenuItems = [
    {
      id: 'overview',
      label: 'Panel General',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    },
    {
      id: 'metrics',
      label: 'Historial de Auditorías',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      )
    },
    {
      id: 'validator',
      label: 'Calificar Desarrollador',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 12 2 2 4-4" />
          <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
        </svg>
      )
    },

    {
      id: 'developers',
      label: 'Perfiles Técnicos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'admin',
      label: 'Administración',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    const isDev = role === 'dev' || role === 'Developer';
    const isAdmin = role === 'admin' || role === 'Administrator';

    if (isDev && (item.id === 'validator' || item.id === 'developers' || item.id === 'admin')) {
      return false;
    }
    if (!isAdmin && item.id === 'admin') {
      return false;
    }
    return true;
  });

  return (
    <aside className="sidebar-container glass">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className="logo-check-path"
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="24"
              strokeDashoffset="24"
            />
          </svg>
        </div>
        <div className="logo-text">
          <h2>NoCode<span className="text-gradient">QA</span></h2>
          <p>Evaluación de Devs</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className={`nav-icon ${isActive ? 'active-icon' : ''}`}>
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              <div className={`active-indicator ${isActive ? 'is-active' : ''}`} />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-card">
          <div className="footer-card-header">
            <span className="pulse-indicator"></span>
            <h4>{role === 'dev' ? 'Dev Portal Active' : (role === 'admin' || role === 'Administrator' ? 'Admin Portal' : role === 'leader' ? 'Leader View Active' : 'QA Auditor Active')}</h4>
          </div>
          <p>{role === 'dev' ? 'Métricas de desarrollo' : (role === 'admin' || role === 'Administrator' ? 'Administración' : role === 'leader' ? 'Métricas de equipo' : 'Módulo de Calificaciones')}</p>
        </div>
      </div>

      <style jsx>{`
        .sidebar-container {
          width: 260px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          border-left: none;
          z-index: 100;
        }

        .sidebar-logo {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 1.1rem;
          box-shadow: var(--shadow-glow);
          flex-shrink: 0;
          opacity: 0;
          transform: scale(0.5) rotate(-12deg);
          animation: logoBadgeIn 0.5s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .logo-check-path {
          animation: logoDrawCheck 0.5s 0.55s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes logoBadgeIn {
          from { opacity: 0; transform: scale(0.5) rotate(-12deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        @keyframes logoDrawCheck {
          to { stroke-dashoffset: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-icon, .logo-check-path {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
        }

        .logo-text h2 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          margin-bottom: 2px;
          letter-spacing: -0.01em;
        }

        .logo-text p {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .sidebar-nav {
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
        }

        [data-theme="light"] .nav-item:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .nav-item.active {
          color: var(--color-primary);
          background: var(--color-primary-glow);
          font-weight: 600;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.05);
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 25%;
          height: 50%;
          width: 4px;
          background-color: var(--color-primary);
          border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
          box-shadow: var(--shadow-glow);
          transform: scaleY(0);
          transform-origin: center;
          opacity: 0;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
        }

        .active-indicator.is-active {
          transform: scaleY(1);
          opacity: 1;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid var(--border-color);
        }

        .footer-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 12px;
        }

        [data-theme="light"] .footer-card {
          background: rgba(0, 0, 0, 0.02);
        }

        .footer-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .pulse-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-success);
          display: inline-block;
          box-shadow: 0 0 8px var(--color-success);
          animation: pulse 2s infinite alternate;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        .footer-card h4 {
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .footer-card p {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </aside>
  );
}
