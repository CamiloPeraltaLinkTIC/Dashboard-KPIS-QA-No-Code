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

  return (
    <header className="header-container glass">
      <div className="header-titles">
        <h1>{getTitle()}</h1>
        <p>{getSubtitle()}</p>
      </div>

      <div className="header-actions">
        {/* Developer Filter */}
        <div className="filter-wrapper">
          <label htmlFor="dev-select">Filtrar por:</label>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <div className="item-marker read"></div>
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
                        <div className={`item-marker ${rev.status === 'approved' ? 'read' : ''}`}></div>
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
          <div className="profile-avatar">{profile?.role?.substring(0, 2).toUpperCase() || 'QA'}</div>
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

        .header-titles h1 {
          font-size: 1.4rem;
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
        }

        .dev-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s ease;
        }

        [data-theme="light"] .dev-select {
          background: rgba(0, 0, 0, 0.03);
        }

        .dev-select:focus {
          border-color: var(--color-primary);
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
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        [data-theme="light"] .icon-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.15);
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
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-primary);
          flex-shrink: 0;
          margin-top: 5px;
        }

        .item-marker.read {
          background-color: var(--text-muted);
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
