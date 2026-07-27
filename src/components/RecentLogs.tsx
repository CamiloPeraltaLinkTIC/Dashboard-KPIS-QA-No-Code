'use client';

import React, { useState } from 'react';
import { DeveloperReview } from '../data/mockData';
import { formatDateTime } from '@/lib/format';

interface RecentLogsProps {
  logs: (DeveloperReview & { developerName: string })[];
}

export default function RecentLogs({ logs }: RecentLogsProps) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Aprobado</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rechazado</span>;
      case 'in_review':
        return <span className="badge badge-warning">En Revisión</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    return 'score-poor';
  };

  const getStatusAccent = (status: string) => {
    if (status === 'approved') return 'var(--color-success)';
    if (status === 'rejected') return 'var(--color-danger)';
    if (status === 'in_review') return 'var(--color-warning)';
    return 'transparent';
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'All') return true;
    return log.status === filterStatus;
  });

  const kpiChips = (log: DeveloperReview) => [
    {
      key: 'pixelPerfect',
      label: 'Pixel Perfect',
      value: `${log.kpis?.pixelPerfect ?? 0}%`,
      tone: 'primary',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
    {
      key: 'dod',
      label: 'Cumplimiento DoD',
      value: `${log.kpis?.cumplimientoDod ?? 0}%`,
      tone: 'success',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    {
      key: 'calidad',
      label: 'Calidad Visual',
      value: `${log.kpis?.calidadVisual ?? 0}%`,
      tone: 'secondary',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z" />
        </svg>
      )
    },
    {
      key: 'errores',
      label: 'Errores Visuales',
      value: log.kpis?.erroresVisuales ?? 0,
      tone: 'danger',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      )
    },
    {
      key: 'retrabajo',
      label: 'Retrabajo',
      value: log.kpis?.retrabajo ?? 0,
      tone: 'warning',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      )
    }
  ];

  return (
    <div className="logs-card glass">
      <div className="logs-header">
        <div className="title-group">
          <h3>Historial de Calificaciones (QA Reviews)</h3>
          <p>Registro ordenado de revisiones individuales por tarea de desarrollo</p>
        </div>

        {/* Filter buttons */}
        <div className="status-filters">
          {['All', 'approved', 'rejected', 'in_review'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
            >
              {status === 'All' ? 'Todos' : 
               status === 'approved' ? 'Aprobados' : 
               status === 'rejected' ? 'Rechazados' : 'En Revisión'}
            </button>
          ))}
        </div>
      </div>

      <div className="table-responsive">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID Review</th>
              <th>Desarrollador</th>
              <th>Tarea / Entregable</th>
              <th>Calificación</th>
              <th>Auditor QA</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const isOpen = selectedLogId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    className={isOpen ? 'row-selected' : ''}
                    style={{ boxShadow: `inset 3px 0 0 ${getStatusAccent(log.status)}` }}
                  >
                    <td className="log-id-cell">{log.id}</td>
                    <td>
                      <strong className="dev-name-cell">{log.developerName}</strong>
                    </td>
                    <td>
                      <span className="project-name">{log.taskName}</span>
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreClass(log.score)}`}>
                        {log.score}/100
                      </span>
                    </td>
                    <td>{log.qaAnalyst}</td>
                    <td className="date-cell">{formatDateTime(log.date)}</td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td>
                      <button
                        className={`view-details-btn ${isOpen ? 'active' : ''}`}
                        onClick={() => setSelectedLogId(isOpen ? null : log.id)}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Ocultar' : 'Detalles'}
                        <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="detail-row">
                      <td className="detail-cell" colSpan={8}>
                        <div className="detail-panel" style={{ borderLeftColor: getStatusAccent(log.status) }}>
                          <div className="detail-panel-header">
                            <div className="detail-title-group">
                              <span className="detail-id">{log.id}</span>
                              {getStatusBadge(log.status)}
                            </div>
                            <button className="close-detail-btn" onClick={() => setSelectedLogId(null)} aria-label="Cerrar detalle">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <h4 className="detail-task-title">{log.taskName} <span className="detail-task-dev">— {log.developerName}</span></h4>
                          <p className="detail-desc">{log.details}</p>

                          <div className="detail-kpi-row">
                            {kpiChips(log).map((chip) => (
                              <div key={chip.key} className={`detail-kpi-chip tone-${chip.tone}`}>
                                <span className="kpi-chip-icon">{chip.icon}</span>
                                <span className="kpi-chip-value">{chip.value}</span>
                                <span className="kpi-chip-label">{chip.label}</span>
                              </div>
                            ))}
                          </div>

                          <div className="detail-meta-row">
                            <div className="meta-block">
                              <span>Desarrollador Calificado</span>
                              <strong>{log.developerName}</strong>
                            </div>
                            <div className="meta-block">
                              <span>Auditor QA Evaluador</span>
                              <strong>{log.qaAnalyst}</strong>
                            </div>
                            <div className="meta-block">
                              <span>Fecha y hora</span>
                              <strong>{formatDateTime(log.date)}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .logs-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .title-group h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .title-group p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .status-filters {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        [data-theme="light"] .status-filters {
          background: rgba(0, 0, 0, 0.02);
        }

        .filter-btn {
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-xs);
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: var(--text-primary);
        }

        .filter-btn.active {
          background: var(--bg-card);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .table-responsive {
          overflow-x: auto;
          width: 100%;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.82rem;
        }

        .logs-table th {
          padding: 12px 16px;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }

        .logs-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .logs-table tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .logs-table tr:hover {
          background: rgba(0, 0, 0, 0.01);
        }

        .row-selected {
          background: rgba(124, 58, 237, 0.04) !important;
        }

        .log-id-cell {
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--color-primary);
        }

        .dev-name-cell {
          color: var(--text-primary);
        }

        .project-name {
          color: var(--text-secondary);
        }

        .platform-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
        }

        [data-theme="light"] .platform-tag {
          background: rgba(0, 0, 0, 0.03);
        }

        .date-cell {
          color: var(--text-muted);
        }

        .score-badge {
          font-family: var(--font-display);
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.78rem;
        }

        .score-excellent {
          background: rgba(16, 185, 129, 0.12);
          color: var(--color-success);
        }

        .score-good {
          background: rgba(249, 115, 22, 0.12);
          color: var(--color-warning);
        }

        .score-poor {
          background: rgba(244, 63, 94, 0.12);
          color: var(--color-danger);
        }

        .view-details-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 550;
          transition: all 0.2s ease;
        }

        .view-details-btn:hover {
          color: var(--color-primary);
          border-color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .view-details-btn.active {
          color: var(--color-primary);
          border-color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .view-details-btn.active .chevron {
          transform: rotate(180deg);
        }

        /* Fila expandible inline debajo de cada registro */
        .logs-table tr.detail-row td.detail-cell {
          padding: 0;
          border-bottom: 1px solid var(--border-color);
        }

        .logs-table tr.detail-row:hover {
          background: transparent;
        }

        .detail-panel {
          padding: 20px 24px 22px;
          border-left: 3px solid var(--color-primary);
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.05), hsla(190, 90%, 50%, 0.03)),
            rgba(255, 255, 255, 0.015);
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: detailPanelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        [data-theme="light"] .detail-panel {
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.04), hsla(190, 90%, 50%, 0.02)),
            rgba(0, 0, 0, 0.01);
        }

        @keyframes detailPanelIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .detail-panel {
            animation: none;
          }
        }

        .detail-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .detail-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-id {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          background: var(--color-primary-glow);
          color: var(--color-primary);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .close-detail-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .close-detail-btn:hover {
          color: white;
          background: var(--color-danger);
          border-color: var(--color-danger);
        }

        .detail-task-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .detail-task-dev {
          font-family: var(--font-sans);
          font-weight: 400;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .detail-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.55;
          max-width: 760px;
        }

        .detail-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }

        .detail-kpi-chip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .detail-kpi-chip {
          background: rgba(0, 0, 0, 0.012);
        }

        .kpi-chip-icon {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tone-primary .kpi-chip-icon {
          color: var(--color-primary);
          background: linear-gradient(135deg, hsla(var(--hue-primary), 85%, 64%, 0.24), hsla(var(--hue-primary), 85%, 64%, 0.05));
        }

        .tone-success .kpi-chip-icon {
          color: var(--color-success);
          background: linear-gradient(135deg, hsla(var(--hue-success), 70%, 45%, 0.24), hsla(var(--hue-success), 70%, 45%, 0.05));
        }

        .tone-secondary .kpi-chip-icon {
          color: var(--color-secondary);
          background: linear-gradient(135deg, hsla(var(--hue-secondary), 90%, 50%, 0.24), hsla(var(--hue-secondary), 90%, 50%, 0.05));
        }

        .tone-danger .kpi-chip-icon {
          color: var(--color-danger);
          background: linear-gradient(135deg, hsla(var(--hue-danger), 85%, 55%, 0.24), hsla(var(--hue-danger), 85%, 55%, 0.05));
        }

        .tone-warning .kpi-chip-icon {
          color: var(--color-warning);
          background: linear-gradient(135deg, hsla(var(--hue-warning), 85%, 55%, 0.24), hsla(var(--hue-warning), 85%, 55%, 0.05));
        }

        .kpi-chip-value {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .kpi-chip-label {
          font-size: 0.66rem;
          color: var(--text-muted);
          font-weight: 600;
          line-height: 1.25;
        }

        .detail-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding-top: 14px;
          border-top: 1px solid var(--border-color);
        }

        .meta-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
        }

        .meta-block span {
          color: var(--text-muted);
        }

        .meta-block strong {
          color: var(--text-primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
