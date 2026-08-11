'use client';

import React from 'react';
import DeveloperSkillsBreakdown from '@/components/DeveloperSkillsBreakdown';
import { BugCategoriesDonut } from '@/components/Charts';
import { formatDateTime } from '@/lib/format';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export default function PerfilesPage() {
  const {
    developers,
    activeProfileId,
    setActiveProfileId,
    setSelectedDeveloper,
    activeProfileData
  } = useDashboardData();

  return (
    <div className="view-pane animate-fade-in">
      {/* Detailed developer profiles tab */}
      <div className="developer-profile-view">
        <div className="dev-profiles-sidebar glass">
          <h3>Desarrolladores</h3>
          <div className="dev-profiles-list">
            {developers.map((d) => (
              <button
                key={d.id}
                onClick={() => { setActiveProfileId(d.id); setSelectedDeveloper(d.name); }}
                className={`dev-profile-tab ${activeProfileId === d.id ? 'active' : ''}`}
              >
                <span className="tab-avatar">
                  {d.avatarUrl ? <img src={d.avatarUrl} alt={d.name} className="avatar-img" /> : d.avatar}
                </span>
                <div className="tab-meta">
                  <strong>{d.name}</strong>
                  <span>{d.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="dev-profile-main glass">
          {activeProfileData ? (
            <div className="profile-container animate-fade-in">
              <div className="profile-hero-row">
                <div className="profile-hero-avatar">
                  {activeProfileData.avatarUrl ? (
                    <img src={activeProfileData.avatarUrl} alt={activeProfileData.name} className="avatar-img" />
                  ) : (
                    activeProfileData.avatar
                  )}
                </div>
                <div className="profile-hero-titles">
                  <h2>{activeProfileData.name}</h2>
                  <p>{activeProfileData.role}</p>
                  <span className="profile-badge-rating" style={{ borderColor: 'var(--color-primary)' }}>
                    Score Promedio: {activeProfileData.complianceRate}/100
                  </span>
                </div>
                <div className="profile-hero-quickstats">
                  <div className="quick-item tone-primary inspect-corners" style={{ animationDelay: '0ms' }}>
                    <span className="quick-item-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <path d="M9 12h6M9 16h6" />
                      </svg>
                    </span>
                    <strong>{activeProfileData.totalTasks}</strong>
                    <span className="quick-item-label">Evaluaciones</span>
                  </div>
                  <div className="quick-item tone-success inspect-corners" style={{ animationDelay: '60ms' }}>
                    <span className="quick-item-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 11 3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </span>
                    <strong>{activeProfileData.approvedFirstTry}</strong>
                    <span className="quick-item-label">Aprobados 1er Intento</span>
                  </div>
                  <div className="quick-item tone-warning inspect-corners" style={{ animationDelay: '120ms' }}>
                    <span className="quick-item-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </span>
                    <strong>{activeProfileData.kpisTotal.retrabajo}</strong>
                    <span className="quick-item-label">Retrabajo</span>
                  </div>
                </div>
              </div>

              <div className="profile-dashboard-grid">
                <div className="profile-skills-pane">
                  <DeveloperSkillsBreakdown developers={developers} selectedDevId={activeProfileData.id} />
                </div>
                <div className="profile-bugs-pane">
                  <BugCategoriesDonut kpis={activeProfileData.kpisTotal} />
                </div>
              </div>

              <div className="profile-reviews-list-wrapper">
                <h3>Historial de Auditorías de {activeProfileData.name}</h3>
                <div className="table-responsive">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tarea / Entrega</th>
                        <th>Score</th>
                        <th>Auditor</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProfileData.reviews.map((rev) => (
                        <tr key={rev.id}>
                          <td className="log-id-cell">{rev.reviewCode || rev.id}</td>
                          <td><strong>{rev.taskName}</strong></td>
                          <td>
                            <span className={`score-badge ${rev.score >= 90 ? 'score-excellent' : rev.score >= 80 ? 'score-good' : 'score-poor'}`}>
                              {rev.score}/100
                            </span>
                          </td>
                          <td>{rev.qaAnalyst}</td>
                          <td>{formatDateTime(rev.date)}</td>
                          <td>
                            <span className={`badge ${rev.status === 'approved' ? 'badge-success' : rev.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                              {rev.status === 'approved' ? 'Aprobado' : rev.status === 'rejected' ? 'Rechazado' : 'En revisión'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-profile-selected">
              <h3>Selecciona un desarrollador</h3>
              <p>Elige un perfil en el menú izquierdo para auditar sus métricas de calidad.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Developer Profiles View Style */
        .developer-profile-view {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .developer-profile-view {
            grid-template-columns: 1fr;
          }
        }

        .dev-profiles-sidebar {
          padding: 16px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dev-profiles-sidebar h3 {
          font-size: 0.95rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .dev-profiles-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dev-profile-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          border-left: 2px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .dev-profile-tab:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
          transform: translateX(2px);
        }

        [data-theme="light"] .dev-profile-tab:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .dev-profile-tab.active {
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.08), hsla(190, 90%, 50%, 0.04)),
            var(--color-primary-glow);
          border-color: var(--border-color);
          border-left-color: var(--color-primary);
          color: var(--color-primary);
        }

        .tab-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--border-color);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
          overflow: hidden;
          transition: background 0.25s ease, box-shadow 0.25s ease;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dev-profile-tab.active .tab-avatar {
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          box-shadow: var(--shadow-glow);
        }

        .tab-meta {
          display: flex;
          flex-direction: column;
        }

        .tab-meta strong {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .tab-meta span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .dev-profile-main {
          padding: 28px;
          border-radius: var(--radius-md);
          min-height: 400px;
        }

        .profile-hero-row {
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .profile-hero-avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          color: white;
          font-weight: 800;
          font-size: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: var(--shadow-glow);
        }

        .profile-hero-titles h2 {
          font-size: 1.4rem;
          color: var(--text-primary);
        }

        .profile-hero-titles p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .profile-badge-rating {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .profile-hero-quickstats {
          margin-left: auto;
          display: flex;
          gap: 20px;
        }

        @media (max-width: 1100px) {
          .profile-hero-quickstats {
            margin-left: 0;
            width: 100%;
            padding-top: 10px;
          }
        }

        .quick-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 18px;
          background:
            linear-gradient(160deg, var(--tone-tint, transparent), var(--bg-app) 65%),
            rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          min-width: 104px;
          opacity: 0;
          animation: quickItemIn 0.45s ease-out forwards;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        [data-theme="light"] .quick-item {
          background:
            linear-gradient(160deg, var(--tone-tint, transparent), rgba(0, 0, 0, 0.01) 65%),
            rgba(0, 0, 0, 0.01);
        }

        .quick-item:hover {
          transform: translateY(-2px);
        }

        @keyframes quickItemIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .quick-item {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        .quick-item.tone-primary {
          --tone-tint: hsla(var(--hue-primary), 85%, 64%, 0.1);
          border-color: hsla(var(--hue-primary), 85%, 64%, 0.22);
        }

        .quick-item.tone-success {
          --tone-tint: hsla(var(--hue-success), 70%, 45%, 0.1);
          border-color: hsla(var(--hue-success), 70%, 45%, 0.22);
        }

        .quick-item.tone-warning {
          --tone-tint: hsla(var(--hue-warning), 85%, 55%, 0.1);
          border-color: hsla(var(--hue-warning), 85%, 55%, 0.22);
        }

        .quick-item-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tone-primary .quick-item-icon {
          color: var(--color-primary);
          background: linear-gradient(135deg, hsla(var(--hue-primary), 85%, 64%, 0.28), hsla(var(--hue-primary), 85%, 64%, 0.08));
        }

        .tone-success .quick-item-icon {
          color: var(--color-success);
          background: linear-gradient(135deg, hsla(var(--hue-success), 70%, 45%, 0.28), hsla(var(--hue-success), 70%, 45%, 0.08));
        }

        .tone-warning .quick-item-icon {
          color: var(--color-warning);
          background: linear-gradient(135deg, hsla(var(--hue-warning), 85%, 55%, 0.28), hsla(var(--hue-warning), 85%, 55%, 0.08));
        }

        .quick-item strong {
          font-family: var(--font-display);
          font-size: 1.3rem;
          color: var(--text-primary);
          font-weight: 700;
          line-height: 1;
        }

        .quick-item-label {
          font-size: 0.64rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 600;
          text-align: center;
        }

        .profile-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 1100px) {
          .profile-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-reviews-list-wrapper h3 {
          font-size: 0.95rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        /* Reusable table overrides for profile review lists */
        .table-responsive {
          overflow-x: auto;
          width: 100%;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }

        .logs-table th {
          padding: 10px 14px;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          font-size: 0.68rem;
          letter-spacing: 0.03em;
        }

        .logs-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .log-id-cell {
          font-family: var(--font-mono);
          color: var(--color-primary);
          font-weight: 600;
        }

        .platform-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.68rem;
          font-weight: 600;
        }

        .score-badge {
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
        }

        .score-excellent {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
        }

        .score-good {
          background: rgba(249, 115, 22, 0.1);
          color: var(--color-warning);
        }

        .score-poor {
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
        }

        .no-profile-selected {
          text-align: center;
          padding: 60px 20px;
        }
      `}</style>
    </div>
  );
}
