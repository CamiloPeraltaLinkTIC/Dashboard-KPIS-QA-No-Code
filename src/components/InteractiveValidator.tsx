'use client';

import React, { useState } from 'react';
import { defaultRuleCategories, DeveloperReview } from '../data/mockData';

interface DeveloperDropdownItem {
  id: string;
  name: string;
}

interface InteractiveValidatorProps {
  onAddReview: (devId: string, review: DeveloperReview) => void;
  developers: DeveloperDropdownItem[];
}

export default function InteractiveValidator({ onAddReview, developers }: InteractiveValidatorProps) {
  const [selectedDevId, setSelectedDevId] = useState(developers[0]?.id || '');
  const [taskName, setTaskName] = useState('');
  const [platform, setPlatform] = useState<'Bubble' | 'FlutterFlow' | 'Make' | 'Zapier' | 'Retool'>('Bubble');
  const [qaAnalyst, setQaAnalyst] = useState('Ana Romero');
  const [notes, setNotes] = useState('');

  // Rules Checklist state
  const [rulesState, setRulesState] = useState(defaultRuleCategories);
  
  // KPI state
  const [pixelPerfect, setPixelPerfect] = useState(100);
  const [cumplimientoDod, setCumplimientoDod] = useState(100);
  const [calidadVisual, setCalidadVisual] = useState(100);
  const [erroresVisuales, setErroresVisuales] = useState(0);
  const [retrabajo, setRetrabajo] = useState(0);

  const toggleRule = (categoryIndex: number, ruleIndex: number) => {
    const updated = [...rulesState];
    updated[categoryIndex].rules[ruleIndex].passed = !updated[categoryIndex].rules[ruleIndex].passed;
    setRulesState(updated);
  };

  const calculateScore = () => {
    let totalWeight = 0;
    let passedWeight = 0;

    rulesState.forEach((cat) => {
      cat.rules.forEach((rule) => {
        const weightVal = rule.weight === 'high' ? 3 : rule.weight === 'medium' ? 2 : 1;
        totalWeight += weightVal;
        if (rule.passed) {
          passedWeight += weightVal;
        }
      });
    });

    const scoreDeduction = (erroresVisuales * 2) + (retrabajo * 5);
    const baseScore = Math.round((passedWeight / totalWeight) * 100);
    const finalScore = Math.max(0, baseScore - scoreDeduction);
    return finalScore;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      alert('Por favor introduce el nombre de la tarea evaluada');
      return;
    }

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
      platform,
      date: new Date().toISOString().split('T')[0],
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

    onAddReview(selectedDevId, newReview);

    // Reset Form
    setTaskName('');
    setNotes('');
    setPixelPerfect(100);
    setCumplimientoDod(100);
    setCalidadVisual(100);
    setErroresVisuales(0);
    setRetrabajo(0);
    setRulesState(JSON.parse(JSON.stringify(defaultRuleCategories)));

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
          <div className="form-row-2">
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
              <label htmlFor="val-platform">Entorno / Plataforma</label>
              <select
                id="val-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
              >
                <option value="Bubble">Bubble.io</option>
                <option value="FlutterFlow">FlutterFlow</option>
                <option value="Make">Make (Integromat)</option>
                <option value="Zapier">Zapier</option>
                <option value="Retool">Retool</option>
              </select>
            </div>
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
            <label htmlFor="val-qa">Auditor QA</label>
            <select
              id="val-qa"
              value={qaAnalyst}
              onChange={(e) => setQaAnalyst(e.target.value)}
            >
              <option value="Ana Romero">Ana Romero</option>
              <option value="Marcos Díaz">Marcos Díaz</option>
            </select>
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
                <span className="counter-label text-gradient" style={{color: 'var(--color-danger)'}}>Errores Visuales</span>
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

      {/* Checklist Rules Evaluation */}
      <div className="checklist-card glass">
        <div className="checklist-header">
          <div className="title-group">
            <h3>Lista de Chequeo Técnico</h3>
            <p>Evalúa el cumplimiento de directrices de desarrollo que afectan la puntuación</p>
          </div>
          <div className="score-live-indicator">
            <span className="score-lbl">Score Estimado</span>
            <span className={`score-val ${scorePreview >= 85 ? 'text-success' : scorePreview >= 75 ? 'text-warning' : 'text-danger'}`}>
              {scorePreview}/100
            </span>
          </div>
        </div>

        <div className="checklist-body">
          {rulesState.map((cat, catIdx) => (
            <div key={catIdx} className="category-group">
              <h4 className="category-title">{cat.category}</h4>
              <div className="rules-list">
                {cat.rules.map((rule, ruleIdx) => (
                  <div
                    key={rule.id}
                    className={`rule-item ${rule.passed ? 'rule-passed' : ''}`}
                    onClick={() => toggleRule(catIdx, ruleIdx)}
                  >
                    <div className="checkbox-wrapper">
                      <div className={`custom-checkbox ${rule.passed ? 'checked' : ''}`}>
                        {rule.passed && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="rule-text-block">
                      <p className="rule-text">{rule.text}</p>
                      <span className={`weight-tag weight-${rule.weight}`}>
                        Peso: {rule.weight === 'high' ? 'Alto' : rule.weight === 'medium' ? 'Medio' : 'Bajo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .validator-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 960px) {
          .validator-grid {
            grid-template-columns: 1fr;
          }
        }

        .validator-card, .checklist-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header h3, .checklist-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .card-header p, .checklist-header p {
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

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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

        /* Checklist Card */
        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
        }

        .score-live-indicator {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .score-lbl {
          font-size: 0.68rem;
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

        .checklist-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .category-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-title {
          font-size: 0.82rem;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 4px;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rule-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xs);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        [data-theme="light"] .rule-item {
          background: rgba(0, 0, 0, 0.01);
        }

        .rule-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        [data-theme="light"] .rule-item:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.12);
        }

        .rule-passed {
          border-color: hsla(var(--hue-success), 70%, 45%, 0.3) !important;
          background: hsla(var(--hue-success), 70%, 45%, 0.03) !important;
        }

        .checkbox-wrapper {
          margin-top: 2px;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: white;
        }

        .custom-checkbox.checked {
          border-color: var(--color-success);
          background-color: var(--color-success);
        }

        .rule-text-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rule-text {
          font-size: 0.8rem;
          line-height: 1.35;
          color: var(--text-primary);
        }

        .weight-tag {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .weight-high { color: var(--color-danger); }
        .weight-medium { color: var(--color-warning); }
        .weight-low { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
