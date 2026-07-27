'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DeveloperReview } from '../data/mockData';
import { useAuth } from '@/components/AuthProvider';

interface DeveloperDropdownItem {
  id: string;
  name: string;
}

interface ProjectDropdownItem {
  id: string;
  name: string;
}

interface ProjectAssignment {
  developer_id: string;
  project_id: string;
}

interface InteractiveValidatorProps {
  onAddReview: (devId: string, projectId: string, review: DeveloperReview) => void;
  developers: DeveloperDropdownItem[];
  projects: ProjectDropdownItem[];
  assignments: ProjectAssignment[];
  preselectedDevId?: string;
}

export default function InteractiveValidator({ onAddReview, developers, projects, assignments, preselectedDevId }: InteractiveValidatorProps) {
  const { profile } = useAuth();
  const [selectedDevId, setSelectedDevId] = useState(preselectedDevId || developers[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');
  const [successModal, setSuccessModal] = useState<{
    devName: string;
    score: number;
    status: 'approved' | 'rejected' | 'in_review';
  } | null>(null);

  // Solo los proyectos enlazados al desarrollador seleccionado
  const availableProjects = useMemo(() => {
    const assignedProjectIds = new Set(
      assignments.filter((a) => a.developer_id === selectedDevId).map((a) => a.project_id)
    );
    return projects.filter((p) => assignedProjectIds.has(p.id));
  }, [projects, assignments, selectedDevId]);

  // Update selected IDs when props load
  useEffect(() => {
    if (developers.length > 0 && !selectedDevId) {
      setSelectedDevId(developers[0].id);
    }
  }, [developers]);

  // Sincroniza con el filtro global de desarrollador (Header): al cambiarlo
  // desde otra pestaña, este formulario debe preseleccionar el mismo dev.
  useEffect(() => {
    if (preselectedDevId) {
      setSelectedDevId(preselectedDevId);
    }
  }, [preselectedDevId]);

  // Mantiene el proyecto seleccionado sincronizado con los proyectos
  // disponibles para el dev actual (cambia al elegir otro desarrollador).
  useEffect(() => {
    if (availableProjects.length > 0) {
      if (!availableProjects.some((p) => p.id === selectedProjectId)) {
        setSelectedProjectId(availableProjects[0].id);
      }
    } else if (selectedProjectId) {
      setSelectedProjectId('');
    }
  }, [availableProjects]);

  // KPI state
  const [pixelPerfect, setPixelPerfect] = useState(100);
  const [cumplimientoDod, setCumplimientoDod] = useState(100);
  const [calidadVisual, setCalidadVisual] = useState(100);
  const [erroresVisuales, setErroresVisuales] = useState(0);
  const [retrabajo, setRetrabajo] = useState(0);

  // Permite escribir el valor directamente en los contadores (además de los botones -/+)
  const handleCounterInput = (raw: string, setter: (v: number) => void, max: number) => {
    if (raw === '') {
      setter(0);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setter(Math.min(max, Math.max(0, Math.trunc(parsed))));
  };

  // El score se calcula a partir de los KPIs: promedio de los porcentajes menos penalizaciones
  const calculateScore = () => {
    const baseScore = Math.round((pixelPerfect + cumplimientoDod + calidadVisual) / 3);
    const scoreDeduction = (erroresVisuales * 2) + (retrabajo * 5);
    return Math.max(0, baseScore - scoreDeduction);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Por favor selecciona un proyecto');
      return;
    }
    if (!taskName.trim()) {
      alert('Por favor introduce el nombre de la tarea evaluada');
      return;
    }

    const qaAnalyst = profile?.username || 'QA';
    const finalScore = calculateScore();
    let status: 'approved' | 'rejected' | 'in_review' = 'in_review';
    if (finalScore >= 85) {
      status = 'approved';
    } else if (finalScore < 75) {
      status = 'rejected';
    }

    const newReview: DeveloperReview = {
      id: `REV-2026-${Math.floor(100 + Math.random() * 900)}`,
      taskName,
      date: new Date().toISOString(),
      score: finalScore,
      status,
      kpis: {
        pixelPerfect,
        cumplimientoDod,
        calidadVisual,
        erroresVisuales,
        retrabajo
      },
      details: notes || `Calificación individual registrada. Cumplimiento de directivas evaluado en ${finalScore}%. ${
        status === 'approved' ? 'El entregable cumple con los estándares técnicos.' : 
        status === 'rejected' ? 'Se rechaza debido a incidencias de severidad crítica.' : 
        'Requiere correcciones menores.'
      }`,
      qaAnalyst
    };

    onAddReview(selectedDevId, selectedProjectId, newReview);

    // Reset Form
    setTaskName('');
    setNotes('');
    setPixelPerfect(100);
    setCumplimientoDod(100);
    setCalidadVisual(100);
    setErroresVisuales(0);
    setRetrabajo(0);

    const selectedDevName = developers.find(d => d.id === selectedDevId)?.name || 'Desarrollador';
    setSuccessModal({ devName: selectedDevName, score: newReview.score, status: newReview.status });
  };

  const statusInfo: Record<'approved' | 'rejected' | 'in_review', { label: string; className: string; icon: string }> = {
    approved: { label: 'Aprobado', className: 'text-success', icon: '✓' },
    rejected: { label: 'Rechazado', className: 'text-danger', icon: '✕' },
    in_review: { label: 'En Revisión', className: 'text-warning', icon: '⏱' },
  };

  const scorePreview = calculateScore();

  return (
    <div className="validator-grid">
      {/* Form Card */}
      <div className="validator-card glass">
        <div className="card-header">
          <span className="card-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 12 2 2 4-4" />
              <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
            </svg>
          </span>
          <div>
            <h3>Nueva Calificación de Desarrollador</h3>
            <p>Evalúa el cumplimiento de directrices técnicas de una entrega específica</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="validator-form">
          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="val-dev">Desarrollador a Calificar</label>
              <div className="select-icon-wrap">
                <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <select
                  id="val-dev"
                  value={selectedDevId}
                  onChange={(e) => setSelectedDevId(e.target.value)}
                >
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="val-project">Proyecto</label>
              <div className="select-icon-wrap">
                <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
                <select
                  id="val-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  disabled={availableProjects.length === 0}
                >
                  {availableProjects.length === 0 ? (
                    <option value="">Sin proyectos enlazados</option>
                  ) : (
                    <>
                      <option value="">-- Selecciona Proyecto --</option>
                      {availableProjects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-name">Tarea / Feature Evaluada</label>
            <div className="input-icon-wrap">
              <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M9 12h6M9 16h6" />
              </svg>
              <input
                id="task-name"
                type="text"
                placeholder="Ej. Integración Stripe Checkout o Pantalla de Configuración"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="qa-auditor-chip">
            <span className="qa-auditor-avatar">{(profile?.username || 'QA').substring(0, 2).toUpperCase()}</span>
            <div className="qa-auditor-text">
              <span className="qa-auditor-label">Auditor QA Evaluador</span>
              <strong className="qa-auditor-name">{profile?.username || 'QA Analyst'}</strong>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="bug-counter-section">
            <h4>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Métricas de Calidad
            </h4>
            <div className="counters-row">
              <div className="counter-box counter-positive">
                <span className="counter-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Pixel Perfect (%)
                </span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setPixelPerfect(Math.max(0, pixelPerfect - 5))} aria-label="Disminuir Pixel Perfect">-</button>
                  <input
                    type="number"
                    className="counter-value"
                    value={pixelPerfect}
                    min={0}
                    max={100}
                    onChange={(e) => handleCounterInput(e.target.value, setPixelPerfect, 100)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Pixel Perfect"
                  />
                  <button type="button" onClick={() => setPixelPerfect(Math.min(100, pixelPerfect + 5))} aria-label="Aumentar Pixel Perfect">+</button>
                </div>
              </div>

              <div className="counter-box counter-positive">
                <span className="counter-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Cumplimiento DoD (%)
                </span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setCumplimientoDod(Math.max(0, cumplimientoDod - 5))} aria-label="Disminuir Cumplimiento DoD">-</button>
                  <input
                    type="number"
                    className="counter-value"
                    value={cumplimientoDod}
                    min={0}
                    max={100}
                    onChange={(e) => handleCounterInput(e.target.value, setCumplimientoDod, 100)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Cumplimiento DoD"
                  />
                  <button type="button" onClick={() => setCumplimientoDod(Math.min(100, cumplimientoDod + 5))} aria-label="Aumentar Cumplimiento DoD">+</button>
                </div>
              </div>

              <div className="counter-box counter-positive">
                <span className="counter-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z" />
                  </svg>
                  Calidad Visual (%)
                </span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setCalidadVisual(Math.max(0, calidadVisual - 5))} aria-label="Disminuir Calidad Visual">-</button>
                  <input
                    type="number"
                    className="counter-value"
                    value={calidadVisual}
                    min={0}
                    max={100}
                    onChange={(e) => handleCounterInput(e.target.value, setCalidadVisual, 100)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Calidad Visual"
                  />
                  <button type="button" onClick={() => setCalidadVisual(Math.min(100, calidadVisual + 5))} aria-label="Aumentar Calidad Visual">+</button>
                </div>
              </div>

              <div className="counter-box counter-danger">
                <span className="counter-label" style={{color: 'var(--color-danger)'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  Errores Visuales y de Diseño
                </span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setErroresVisuales(Math.max(0, erroresVisuales - 1))} aria-label="Disminuir Errores Visuales">-</button>
                  <input
                    type="number"
                    className="counter-value"
                    value={erroresVisuales}
                    min={0}
                    max={999}
                    onChange={(e) => handleCounterInput(e.target.value, setErroresVisuales, 999)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Errores Visuales"
                  />
                  <button type="button" onClick={() => setErroresVisuales(erroresVisuales + 1)} aria-label="Aumentar Errores Visuales">+</button>
                </div>
              </div>

              <div className="counter-box counter-warning">
                <span className="counter-label" style={{color: 'var(--color-warning)'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Retrabajo
                </span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setRetrabajo(Math.max(0, retrabajo - 1))} aria-label="Disminuir Retrabajo">-</button>
                  <input
                    type="number"
                    className="counter-value"
                    value={retrabajo}
                    min={0}
                    max={999}
                    onChange={(e) => handleCounterInput(e.target.value, setRetrabajo, 999)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Retrabajo"
                  />
                  <button type="button" onClick={() => setRetrabajo(retrabajo + 1)} aria-label="Aumentar Retrabajo">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="score-live-row inspect-corners">
            <span className="score-lbl">Score Estimado</span>
            <span className={`score-val ${scorePreview >= 85 ? 'text-success' : scorePreview >= 75 ? 'text-warning' : 'text-danger'}`}>
              {scorePreview}/100
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="val-notes">Observaciones de Calidad / Retroalimentación</label>
            <textarea
              id="val-notes"
              rows={3}
              placeholder="Detalla fortalezas y debilidades técnicas observadas en el entregable..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="submit-qa-btn">
            Guardar Calificación en Historial
          </button>
        </form>
      </div>

      {successModal && (
        <div className="success-overlay" onClick={() => setSuccessModal(null)}>
          <div className="success-card glass" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="success-close"
              onClick={() => setSuccessModal(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className={`success-icon ${statusInfo[successModal.status].className}`}>
              {statusInfo[successModal.status].icon}
            </div>

            <h3>¡Evaluación registrada con éxito!</h3>
            <p className="success-subtitle">La calificación quedó guardada en el historial del desarrollador</p>

            <div className="success-details">
              <div className="success-row">
                <span className="success-label">Desarrollador</span>
                <span className="success-value">{successModal.devName}</span>
              </div>
              <div className="success-row">
                <span className="success-label">Score</span>
                <span className={`success-value success-score ${statusInfo[successModal.status].className}`}>
                  {successModal.score}/100
                </span>
              </div>
              <div className="success-row">
                <span className="success-label">Estado</span>
                <span className={`status-pill ${statusInfo[successModal.status].className}`}>
                  {statusInfo[successModal.status].label}
                </span>
              </div>
            </div>

            <button type="button" className="success-confirm-btn" onClick={() => setSuccessModal(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .validator-grid {
          display: grid;
          grid-template-columns: minmax(0, 760px);
          justify-content: center;
          gap: 24px;
          align-items: start;
        }

        .score-live-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .score-live-row {
          background: rgba(0, 0, 0, 0.02);
        }

        @media (max-width: 960px) {
          .validator-grid {
            grid-template-columns: 1fr;
          }
        }

        .validator-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .card-header-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: var(--shadow-glow);
        }

        .card-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .card-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .validator-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .validator-form > *:not(.submit-qa-btn) {
          opacity: 0;
          animation: fieldIn 0.4s ease-out forwards;
        }

        .validator-form > *:nth-child(1) { animation-delay: 0.03s; }
        .validator-form > *:nth-child(2) { animation-delay: 0.08s; }
        .validator-form > *:nth-child(3) { animation-delay: 0.13s; }
        .validator-form > *:nth-child(4) { animation-delay: 0.18s; }
        .validator-form > *:nth-child(5) { animation-delay: 0.23s; }
        .validator-form > *:nth-child(6) { animation-delay: 0.28s; }
        .validator-form > *:nth-child(7) { animation-delay: 0.33s; }

        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .validator-form > * {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        .form-row-2col {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .input-icon-wrap,
        .select-icon-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        [data-theme="light"] .input-icon-wrap,
        [data-theme="light"] .select-icon-wrap {
          background: rgba(0, 0, 0, 0.02);
        }

        .input-icon-wrap:focus-within,
        .select-icon-wrap:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--border-focus);
        }

        .field-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: color 0.2s ease;
        }

        .input-icon-wrap:focus-within .field-icon,
        .select-icon-wrap:focus-within .field-icon {
          color: var(--color-primary);
        }

        .input-icon-wrap input,
        .select-icon-wrap select {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          padding: 10px 0;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }

        .qa-auditor-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .qa-auditor-chip {
          background: rgba(0, 0, 0, 0.015);
        }

        .qa-auditor-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .qa-auditor-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .qa-auditor-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 600;
        }

        .qa-auditor-name {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .validator-form textarea {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        [data-theme="light"] .validator-form textarea {
          background: rgba(0, 0, 0, 0.02);
        }

        .validator-form textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--border-focus);
        }

        .bug-counter-section {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 14px;
        }

        [data-theme="light"] .bug-counter-section {
          background: rgba(0, 0, 0, 0.01);
        }

        .bug-counter-section h4 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .bug-counter-section h4 svg {
          color: var(--color-primary);
        }

        .counters-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .counter-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xs);
          padding: 8px;
          min-width: 90px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .counter-box:hover {
          transform: translateY(-1px);
        }

        .counter-positive {
          background: linear-gradient(160deg, hsla(var(--hue-success), 70%, 45%, 0.09), var(--bg-app) 65%);
          border-color: hsla(var(--hue-success), 70%, 45%, 0.25);
        }

        .counter-positive .counter-label {
          color: var(--color-success);
        }

        .counter-danger {
          background: linear-gradient(160deg, hsla(var(--hue-danger), 85%, 55%, 0.09), var(--bg-app) 65%);
          border-color: hsla(var(--hue-danger), 85%, 55%, 0.25);
        }

        .counter-warning {
          background: linear-gradient(160deg, hsla(var(--hue-warning), 85%, 55%, 0.09), var(--bg-app) 65%);
          border-color: hsla(var(--hue-warning), 85%, 55%, 0.25);
        }

        .counter-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          text-align: center;
          justify-content: center;
        }

        .counter-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
          padding-top: 6px;
        }

        .counter-actions button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .counter-actions button:hover {
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .counter-value {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          width: 38px;
          text-align: center;
          color: var(--text-primary);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-xs);
          padding: 3px 0;
          -moz-appearance: textfield;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }

        .counter-value::-webkit-outer-spin-button,
        .counter-value::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .counter-value:hover {
          border-color: var(--border-color);
        }

        .counter-value:focus {
          outline: none;
          border-color: var(--color-primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        .submit-qa-btn {
          margin-top: 8px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-weight: 700;
          border: none;
          padding: 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.9rem;
          opacity: 0;
          animation: fieldIn 0.4s ease-out 0.33s forwards, pulse-glow 3s ease-in-out 0.73s infinite;
          transition: transform 0.2s ease;
        }

        .submit-qa-btn:hover {
          transform: translateY(-1px);
        }

        .submit-qa-btn:active {
          transform: translateY(1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .submit-qa-btn {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        /* Indicador de Score */
        .score-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .score-val {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-danger { color: var(--color-danger); }

        /* Popup de confirmación */
        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: overlayFadeIn 0.2s ease;
        }

        .success-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          padding: 32px 28px 28px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          animation: cardPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .success-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }

        .success-close:hover {
          background: var(--color-danger);
          border-color: var(--color-danger);
          color: white;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 800;
          background: currentColor;
          margin-bottom: 8px;
        }

        .success-icon.text-success { background: var(--color-success); color: white !important; }
        .success-icon.text-warning { background: var(--color-warning); color: white !important; }
        .success-icon.text-danger { background: var(--color-danger); color: white !important; }

        .success-card h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin: 0;
        }

        .success-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0 0 12px;
        }

        .success-details {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .success-details {
          background: rgba(0, 0, 0, 0.02);
        }

        .success-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .success-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .success-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .success-score {
          font-size: 1.1rem;
        }

        .status-pill {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          color: white !important;
        }

        .status-pill.text-success { background: var(--color-success); }
        .status-pill.text-warning { background: var(--color-warning); }
        .status-pill.text-danger { background: var(--color-danger); }

        .success-confirm-btn {
          width: 100%;
          margin-top: 18px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-weight: 700;
          border: none;
          padding: 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.88rem;
          transition: transform 0.2s ease;
        }

        .success-confirm-btn:hover {
          transform: translateY(-1px);
        }

        .success-confirm-btn:active {
          transform: translateY(1px);
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cardPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
