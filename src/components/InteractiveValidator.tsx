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
}

export default function InteractiveValidator({ onAddReview, developers, projects, assignments }: InteractiveValidatorProps) {
  const { profile } = useAuth();
  const [selectedDevId, setSelectedDevId] = useState(developers[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');

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
    alert(`¡Evaluación registrada con éxito!\nDesarrollador: ${selectedDevName}\nScore: ${newReview.score}/100\nEstado: ${newReview.status.toUpperCase()}`);
  };

  const scorePreview = calculateScore();

  return (
    <div className="validator-grid">
      {/* Form Card */}
      <div className="validator-card glass">
        <div className="card-header">
          <h3>Nueva Calificación de Desarrollador</h3>
          <p>Evalúa el cumplimiento de directrices técnicas de una entrega específica</p>
        </div>

        <form onSubmit={handleSubmit} className="validator-form">
          <div className="form-group">
            <label htmlFor="val-dev">Desarrollador a Calificar</label>
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

          <div className="form-group">
            <label htmlFor="val-project">Proyecto</label>
            <select
              id="val-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              disabled={availableProjects.length === 0}
            >
              {availableProjects.length === 0 ? (
                <option value="">Este desarrollador no tiene proyectos enlazados</option>
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

          <div className="form-group">
            <label htmlFor="task-name">Tarea / Feature Evaluada</label>
            <input
              id="task-name"
              type="text"
              placeholder="Ej. Integración Stripe Checkout o Pantalla de Configuración"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Auditor QA Evaluador</label>
            <input
              type="text"
              value={profile?.username || 'QA Analyst'}
              disabled
              style={{ opacity: 0.8, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          {/* KPIs Section */}
          <div className="bug-counter-section">
            <h4>Métricas de Calidad</h4>
            <div className="counters-row">
              <div className="counter-box">
                <span className="counter-label text-gradient">Pixel Perfect (%)</span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setPixelPerfect(Math.max(0, pixelPerfect - 5))}>-</button>
                  <span className="counter-value">{pixelPerfect}</span>
                  <button type="button" onClick={() => setPixelPerfect(Math.min(100, pixelPerfect + 5))}>+</button>
                </div>
              </div>

              <div className="counter-box">
                <span className="counter-label text-gradient">Cumplimiento DoD (%)</span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setCumplimientoDod(Math.max(0, cumplimientoDod - 5))}>-</button>
                  <span className="counter-value">{cumplimientoDod}</span>
                  <button type="button" onClick={() => setCumplimientoDod(Math.min(100, cumplimientoDod + 5))}>+</button>
                </div>
              </div>

              <div className="counter-box">
                <span className="counter-label text-gradient">Calidad Visual (%)</span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setCalidadVisual(Math.max(0, calidadVisual - 5))}>-</button>
                  <span className="counter-value">{calidadVisual}</span>
                  <button type="button" onClick={() => setCalidadVisual(Math.min(100, calidadVisual + 5))}>+</button>
                </div>
              </div>

              <div className="counter-box">
                <span className="counter-label text-gradient" style={{color: 'var(--color-danger)'}}>Errores Visuales y de Diseño</span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setErroresVisuales(Math.max(0, erroresVisuales - 1))}>-</button>
                  <span className="counter-value">{erroresVisuales}</span>
                  <button type="button" onClick={() => setErroresVisuales(erroresVisuales + 1)}>+</button>
                </div>
              </div>

              <div className="counter-box">
                <span className="counter-label text-gradient" style={{color: 'var(--color-warning)'}}>Retrabajo</span>
                <div className="counter-actions">
                  <button type="button" onClick={() => setRetrabajo(Math.max(0, retrabajo - 1))}>-</button>
                  <span className="counter-value">{retrabajo}</span>
                  <button type="button" onClick={() => setRetrabajo(retrabajo + 1)}>+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="score-live-row">
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

          <button type="submit" className="submit-qa-btn glow-pulse">
            Guardar Calificación en Historial
          </button>
        </form>
      </div>

      <style jsx>{`
        .validator-grid {
          display: grid;
          grid-template-columns: minmax(0, 680px);
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

        .validator-form input[type="text"],
        .validator-form select,
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

        [data-theme="light"] .validator-form input[type="text"],
        [data-theme="light"] .validator-form select,
        [data-theme="light"] .validator-form textarea {
          background: rgba(0, 0, 0, 0.02);
        }

        .validator-form input[type="text"]:focus,
        .validator-form select:focus,
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
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
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
        }

        .counter-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .counter-actions {
          display: flex;
          align-items: center;
          gap: 10px;
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
          font-weight: 750;
          font-size: 0.95rem;
          min-width: 14px;
          text-align: center;
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
          transition: transform 0.2s ease;
        }

        .submit-qa-btn:hover {
          transform: translateY(-1px);
        }

        .submit-qa-btn:active {
          transform: translateY(1px);
        }

        /* Indicador de Score */
        .score-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .score-val {
          font-size: 1.6rem;
          font-weight: 850;
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-danger { color: var(--color-danger); }
      `}</style>
    </div>
  );
}
