'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { formatDateTime } from '@/lib/format';

interface DeveloperItem {
  id: string;
  name: string;
}

interface ReviewNotification {
  id: string;
  developerName: string;
  taskName: string;
  score: number;
  status: string;
  date: string;
}

interface HeaderProps {
  currentTab: string;
  selectedDeveloper: string;
  setSelectedDeveloper: (developer: string) => void;
  developers: DeveloperItem[];
  recentReviews: ReviewNotification[];
}

export default function Header({
  currentTab,
  selectedDeveloper,
  setSelectedDeveloper,
  developers,
  recentReviews
}: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Evaluación de Desarrolladores No-Code';
      case 'metrics':
        return 'Historial de Auditorías';
      case 'validator':
        return 'Calificar Desarrollador (Nueva Auditoría)';
      case 'developers':
        return 'Perfiles Técnicos Individuales';
      default:
        return 'NoCode QA Evaluation';
    }
  };

  const getSubtitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Control de desempeño, tasas de aprobación técnica y clasificación de bugs del equipo de desarrollo.';
      case 'metrics':
        return 'Registro completo y auditoría cronológica de tareas revisadas.';
      case 'validator':
        return 'Evalúa los lineamientos técnicos de un entregable y calcula la calificación del desarrollador.';
      case 'developers':
        return 'Análisis detallado de aptitudes y evolución técnica por programador.';
      default:
        return 'Métricas de calidad y desempeño.';
    }
  };

  const getTabIcon = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        );
      case 'metrics':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" x2="18" y1="20" y2="10" />
            <line x1="12" x2="12" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="14" />
          </svg>
        );
      case 'validator':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 12 2 2 4-4" />
            <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
          </svg>
        );
      case 'developers':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    }
    if (status === 'rejected') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  };

  return (
    <header className="header-container glass animate-fade-in">
      <div className="header-titles">
        <span className="header-tab-icon">{getTabIcon()}</span>
        <div>
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Developer Filter */}
        <div className="filter-wrapper">
          <svg className="filter-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <select
            id="dev-select"
            value={selectedDeveloper}
            onChange={(e) => setSelectedDeveloper(e.target.value)}
            className="dev-select"
          >
            <option value="All">Todos los desarrolladores</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.name}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Cambiar Tema" aria-label="Cambiar Tema">
          {theme === 'dark' ? (
            <svg key="sun" className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg key="moon" className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button
            className="icon-btn notification-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {recentReviews.length > 0 && <span className="notification-badge"></span>}
          </button>

          {notificationsOpen && (
            <div className="notifications-dropdown glass">
              <div className="dropdown-header">
                <h3>Últimos Eventos de QA</h3>
                <button className="clear-btn" onClick={() => setNotificationsOpen(false)}>Cerrar</button>
              </div>
              <div className="dropdown-content">
                {recentReviews.length === 0 ? (
                  <div className="notification-item">
                    <div className="item-marker tone-neutral">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      </svg>
                    </div>
                    <div className="item-text">
                      <p>Aún no hay evaluaciones registradas.</p>
                    </div>
                  </div>
                ) : (
                  recentReviews.map((rev) => {
                    const statusText =
                      rev.status === 'approved' ? 'Aprobado' :
                      rev.status === 'rejected' ? 'Rechazado' : 'En revisión';
                    return (
                      <div key={rev.id} className={`notification-item ${rev.status === 'rejected' ? 'unread' : ''}`}>
                        <div className={`item-marker tone-${rev.status}`}>{getStatusIcon(rev.status)}</div>
                        <div className="item-text">
                          <p><strong>{rev.developerName}</strong> — {rev.taskName}: <strong>{rev.score}/100</strong> ({statusText})</p>
                          <span className={rev.status === 'rejected' ? 'danger-text' : ''}>{formatDateTime(rev.date)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="user-profile">
          <div className="profile-avatar">
            {profile?.role?.substring(0, 2).toUpperCase() || 'QA'}
            <span className="profile-status-dot" />
          </div>
          <div className="profile-info">
            <span className="user-name">{profile?.full_name || profile?.username || 'Usuario'}</span>
            <span className="user-role">{profile?.role === 'leader' ? 'Líder' : (profile?.role === 'admin' || profile?.role === 'Administrator') ? 'Admin' : (profile?.role === 'dev' || profile?.role === 'Developer') ? 'Desarrollador' : 'QA'}</span>
          </div>
          <button className="icon-btn logout-btn" onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          z-index: 90;
        }

        .header-titles {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-tab-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: var(--shadow-glow);
        }

        .header-titles h1 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .header-titles p {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0 12px 0 10px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        [data-theme="light"] .filter-wrapper {
          background: rgba(0, 0, 0, 0.03);
        }

        .filter-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        .filter-icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .dev-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 9px 0;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        [data-theme="light"] .icon-btn {
          background: rgba(0, 0, 0, 0.02);
        }

        .icon-btn:hover {
          color: var(--color-primary);
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }

        .icon-btn:active {
          transform: translateY(0);
        }

        .theme-icon {
          animation: themeIconIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes themeIconIn {
          from { opacity: 0; transform: rotate(-45deg) scale(0.6); }
          to { opacity: 1; transform: rotate(0deg) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .theme-icon {
            animation: none;
          }
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background-color: var(--color-danger);
          border-radius: 50%;
          border: 2px solid var(--bg-app);
          box-shadow: 0 0 6px var(--color-danger);
          animation: notifPulse 2s infinite alternate;
        }

        @keyframes notifPulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          100% { transform: scale(1.25); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .notification-badge {
            animation: none !important;
          }
        }

        .notification-wrapper {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          width: 320px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 16px;
          z-index: 120;
          animation: dropdownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .dropdown-header h3 {
          font-size: 0.9rem;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: var(--color-primary);
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
        }

        .dropdown-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px;
          border-radius: var(--radius-xs);
          transition: background-color 0.2s ease;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        [data-theme="light"] .notification-item:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .notification-item.unread {
          background: rgba(124, 58, 237, 0.05);
        }

        .item-marker {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .item-marker.tone-approved {
          color: var(--color-success);
          background: hsla(var(--hue-success), 70%, 45%, 0.15);
        }

        .item-marker.tone-rejected {
          color: var(--color-danger);
          background: hsla(var(--hue-danger), 85%, 55%, 0.15);
        }

        .item-marker.tone-in_review {
          color: var(--color-warning);
          background: hsla(var(--hue-warning), 85%, 55%, 0.15);
        }

        .item-marker.tone-neutral {
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .item-text p {
          font-size: 0.78rem;
          line-height: 1.3;
          margin-bottom: 4px;
        }

        .item-text span {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .danger-text {
          color: var(--color-danger) !important;
          font-weight: 500;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-left: 16px;
          border-left: 1px solid var(--border-color);
        }

        .profile-avatar {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 0.85rem;
          box-shadow: var(--shadow-glow);
        }

        .profile-status-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-success);
          border: 2px solid var(--bg-card);
          box-shadow: 0 0 6px var(--color-success);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .logout-btn {
          margin-left: 8px;
          width: 32px;
          height: 32px;
          border: none;
          color: var(--color-danger);
          background: rgba(244, 63, 94, 0.1);
        }

        .logout-btn:hover {
          background: rgba(244, 63, 94, 0.2);
          color: var(--color-danger);
        }
      `}</style>
    </header>
  );
}
