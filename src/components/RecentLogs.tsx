'use client';

import React, { useState } from 'react';
import { DeveloperReview } from '../data/mockData';

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

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'All') return true;
    return log.status === filterStatus;
  });

  const selectedLog = logs.find((l) => l.id === selectedLogId);

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
              <th>Plataforma</th>
              <th>Calificación</th>
              <th>Auditor QA</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={selectedLogId === log.id ? 'row-selected' : ''}>
                <td className="log-id-cell">{log.id}</td>
                <td>
                  <strong className="dev-name-cell">{log.developerName}</strong>
                </td>
                <td>
                  <span className="project-name">{log.taskName}</span>
                </td>
                <td>
                  <span className="platform-tag">{log.platform}</span>
                </td>
                <td>
                  <span className={`score-badge ${getScoreClass(log.score)}`}>
                    {log.score}/100
                  </span>
                </td>
                <td>{log.qaAnalyst}</td>
                <td className="date-cell">{log.date}</td>
                <td>{getStatusBadge(log.status)}</td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                  >
                    {selectedLogId === log.id ? 'Ocultar' : 'Detalles'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expandable Detail Drawer */}
      {selectedLog && (
        <div className="detail-drawer glass animate-fade-in">
          <div className="drawer-header">
            <div className="drawer-title">
              <span className="drawer-id">{selectedLog.id}</span>
              <h4>{selectedLog.taskName} - <strong>{selectedLog.developerName}</strong></h4>
            </div>
            <button className="close-drawer-btn" onClick={() => setSelectedLogId(null)}>×</button>
          </div>
          <div className="drawer-body">
            <div className="drawer-grid">
              <div className="drawer-section">
                <h5>Evaluación Detallada</h5>
                <p className="drawer-desc">{selectedLog.details}</p>
              </div>

              <div className="drawer-section">
                <h5>Conteo de Bugs Registrados</h5>
                <div className="bugs-distribution">
                  <div className="bug-dist-item">
                    <span className="bug-count count-visual">{selectedLog.bugsFound.visual}</span>
                    <span className="bug-label">Visuales / UI</span>
                  </div>
                  <div className="bug-dist-item">
                    <span className="bug-count count-logic">{selectedLog.bugsFound.logic}</span>
                    <span className="bug-label">Lógicos / Funcional</span>
                  </div>
                  <div className="bug-dist-item">
                    <span className="bug-count count-perf">{selectedLog.bugsFound.performance}</span>
                    <span className="bug-label">Rendimiento / APIs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-meta-row">
              <div className="meta-block">
                <span>Desarrollador Calificado:</span>
                <strong>{selectedLog.developerName}</strong>
              </div>
              <div className="meta-block">
                <span>Auditor QA Evaluador:</span>
                <strong>{selectedLog.qaAnalyst}</strong>
              </div>
              <div className="meta-block">
                <span>Entorno Técnico:</span>
                <span className="platform-tag-large">{selectedLog.platform}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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

        /* Detail Drawer */
        .detail-drawer {
          border-radius: var(--radius-sm);
          padding: 20px;
          margin-top: 16px;
          border-left: 4px solid var(--color-primary);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .drawer-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .drawer-id {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          background: var(--color-primary-glow);
          color: var(--color-primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .drawer-title h4 {
          font-size: 1rem;
          color: var(--text-primary);
        }

        .close-drawer-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.4rem;
          cursor: pointer;
          transition: color 0.2s ease;
          line-height: 1;
        }

        .close-drawer-btn:hover {
          color: var(--text-primary);
        }

        .drawer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .drawer-section h5 {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .drawer-desc {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .bugs-distribution {
          display: flex;
          gap: 12px;
        }

        .bug-dist-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xs);
        }

        [data-theme="light"] .bug-dist-item {
          background: rgba(0, 0, 0, 0.01);
        }

        .bug-count {
          font-size: 1.2rem;
          font-weight: 750;
        }

        .count-visual { color: var(--color-secondary); }
        .count-logic { color: var(--color-primary); }
        .count-perf { color: var(--color-warning); }

        .bug-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 4px;
        }

        .drawer-meta-row {
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

        .platform-tag-large {
          font-weight: 700;
          color: var(--color-primary);
          background: var(--color-primary-glow);
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }
      `}</style>
    </div>
  );
}
