'use client';

import React, { useState, useMemo } from 'react';

interface DeveloperBugBreakdown {
  id: string;
  name: string;
  erroresVisuales: number;
  retrabajo: number;
}

interface DonutProps {
  kpis: { erroresVisuales: number; retrabajo: number };
  developersBreakdown?: DeveloperBugBreakdown[];
}

export function BugCategoriesDonut({ kpis, developersBreakdown }: DonutProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const totalErrores = kpis.erroresVisuales;
  const totalRetrabajo = kpis.retrabajo;

  const grandTotal = totalErrores + totalRetrabajo || 1;
  const categories = [
    { name: 'Errores Visuales y de Diseño', key: 'erroresVisuales' as const, count: totalErrores, color: 'var(--color-danger)', percentage: (totalErrores / grandTotal) * 100 },
    { name: 'Retrabajo', key: 'retrabajo' as const, count: totalRetrabajo, color: 'var(--color-warning)', percentage: (totalRetrabajo / grandTotal) * 100 }
  ];

  const canShowBreakdown = !!developersBreakdown && developersBreakdown.length > 0;

  // Quiénes tienen la incidencia de la categoría bajo el mouse (tooltip on-hover).
  const tooltipRows = useMemo(() => {
    if (hoveredSlice === null || !developersBreakdown) return [];
    const key = categories[hoveredSlice].key;
    return developersBreakdown
      .filter((d) => d[key] > 0)
      .map((d) => ({ id: d.id, name: d.name, value: d[key] }))
      .sort((a, b) => b.value - a.value);
  }, [hoveredSlice, developersBreakdown]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 16;
  const center = 80;

  let currentDashOffset = 0;

  return (
    <div className="donut-container glass">
      <div className="donut-header">
        <h3>Distribución de Fallas</h3>
        <p>Proporción entre Errores Visuales y Retrabajo en QA</p>
        {canShowBreakdown && <p className="donut-hint">Pasa el mouse sobre una categoría para ver quién la tiene</p>}
      </div>

      <div className="donut-content">
        <div className="svg-donut-wrapper">
          <svg width={center * 2} height={center * 2} viewBox={`0 0 ${center * 2} ${center * 2}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
            />

            {categories.map((cat, index) => {
              const dashArray = circumference;
              const strokeOffset = circumference - (cat.percentage / 100) * circumference;
              const rotation = (currentDashOffset / circumference) * 360 - 90;

              currentDashOffset += (cat.percentage / 100) * circumference;

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={hoveredSlice === index ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(${rotation} ${center} ${center})`}
                  style={{
                    transition: 'stroke-width 0.2s ease, stroke 0.2s ease, stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: canShowBreakdown ? 'pointer' : 'default'
                  }}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          <div className="donut-center-label">
            {hoveredSlice !== null ? (
              <>
                <span className="center-value">{Math.round(categories[hoveredSlice].percentage)}%</span>
                <span className="center-text">{categories[hoveredSlice].name.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <span className="center-value">{totalErrores + totalRetrabajo}</span>
                <span className="center-text">Incidencias Total</span>
              </>
            )}
          </div>

          {hoveredSlice !== null && canShowBreakdown && (
            <div className="donut-tooltip">
              <div className="tooltip-header">
                <span className="tooltip-dot" style={{ backgroundColor: categories[hoveredSlice].color }} />
                {categories[hoveredSlice].name}
              </div>
              <div className="tooltip-body">
                {tooltipRows.length === 0 ? (
                  <span className="tooltip-empty">Nadie registra esta incidencia.</span>
                ) : (
                  tooltipRows.map((dev) => (
                    <div key={dev.id} className="tooltip-row">
                      <span>{dev.name}</span>
                      <strong>{dev.value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="donut-legend">
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`legend-row ${hoveredSlice === index ? 'focused' : ''}`}
              onMouseEnter={() => setHoveredSlice(index)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="legend-label-group">
                <span className="legend-color-indicator" style={{ backgroundColor: cat.color }}></span>
                <span className="legend-cat-name">{cat.name}</span>
              </div>
              <div className="legend-values">
                <span className="legend-count">{cat.count}</span>
                <span className="legend-percent">({Math.round(cat.percentage)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .donut-container {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-width: 280px;
        }

        .donut-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .donut-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .donut-hint {
          font-size: 0.68rem !important;
          color: var(--color-primary) !important;
          margin-top: 2px;
        }

        .donut-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          padding: 10px 0;
          height: 100%;
        }

        .svg-donut-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-center-label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
        }

        .center-value {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.05;
        }

        .center-text {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 3px;
          max-width: 90px;
          line-height: 1.2;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 160px;
        }

        .legend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: var(--radius-xs);
          transition: background-color 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }

        .legend-row:hover, .legend-row.focused {
          background: rgba(255, 255, 255, 0.03);
          transform: translateX(3px);
        }

        [data-theme="light"] .legend-row:hover, [data-theme="light"] .legend-row.focused {
          background: rgba(0, 0, 0, 0.02);
        }

        .legend-label-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .legend-color-indicator {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-cat-name {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 500;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .legend-values {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          flex-shrink: 0;
        }

        .legend-count {
          color: var(--text-primary);
          font-weight: 600;
        }

        .legend-percent {
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .donut-tooltip {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: max-content;
          max-width: 220px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          pointer-events: none;
          animation: tooltipFade 0.15s ease-out;
        }

        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .donut-tooltip {
            animation: none;
          }
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border-color);
          white-space: nowrap;
        }

        .tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .tooltip-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 140px;
          overflow-y: auto;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.72rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .tooltip-row strong {
          color: var(--color-primary);
        }

        .tooltip-empty {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: normal;
        }
      `}</style>
    </div>
  );
}
