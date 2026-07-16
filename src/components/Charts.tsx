'use client';

import React, { useState } from 'react';
import { WeeklyTrend } from '../data/mockData';

interface ChartsProps {
  weeklyData: WeeklyTrend[];
}

export function WeeklyBugsChart({ weeklyData }: ChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const totalBugsList = weeklyData.map(d => d.totalBugs);
  const resolvedList = weeklyData.map(d => Math.round(d.totalBugs * 0.8));
  
  const allValues = [...totalBugsList, ...resolvedList];
  const maxValue = Math.max(...allValues, 10);
  const minValue = 0;
  const range = maxValue - minValue;

  const getCoordinates = (list: number[]) => {
    return list.map((val, index) => {
      const x = paddingLeft + (index / (list.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minValue) / range) * chartHeight;
      return { x, y, value: val };
    });
  };

  const totalCoords = getCoordinates(totalBugsList);
  const resolvedCoords = getCoordinates(resolvedList);

  const linePath = (coords: { x: number; y: number }[]) => {
    return coords.reduce((acc, coord, index) => {
      return index === 0 ? `M ${coord.x},${coord.y}` : `${acc} L ${coord.x},${coord.y}`;
    }, '');
  };

  const areaPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    const first = coords[0];
    const last = coords[coords.length - 1];
    const line = linePath(coords);
    return `${line} L ${last.x},${paddingTop + chartHeight} L ${first.x},${paddingTop + chartHeight} Z`;
  };

  const gridLinesY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="chart-container glass">
      <div className="chart-header">
        <div className="chart-title-group">
          <h3>Evolución General de Calidad</h3>
          <p>Comparativa semanal de incidencias encontradas y ritmo de corrección</p>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot color-bugs"></span>
            <span>Detectados</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot color-resolved"></span>
            <span>Corregidos</span>
          </div>
        </div>
      </div>

      <div className="svg-wrapper">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bugsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-danger)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-danger)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="resolvedAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLinesY.map((ratio, index) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(minValue + ratio * range);
            return (
              <g key={index} className="grid-group">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {weeklyData.map((d, index) => {
            const x = paddingLeft + (index / (weeklyData.length - 1)) * chartWidth;
            return (
              <text
                key={index}
                x={x}
                y={paddingTop + chartHeight + 20}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
                fontWeight="600"
              >
                {d.week}
              </text>
            );
          })}

          <path d={areaPath(totalCoords)} fill="url(#bugsAreaGrad)" />
          <path d={areaPath(resolvedCoords)} fill="url(#resolvedAreaGrad)" />

          <path
            d={linePath(totalCoords)}
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath(resolvedCoords)}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {totalCoords.map((coord, index) => (
            <circle
              key={`bugs-dot-${index}`}
              cx={coord.x}
              cy={coord.y}
              r={hoveredIndex === index ? 6 : 4}
              fill="var(--bg-app)"
              stroke="var(--color-danger)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {resolvedCoords.map((coord, index) => (
            <circle
              key={`res-dot-${index}`}
              cx={coord.x}
              cy={coord.y}
              r={hoveredIndex === index ? 6 : 4}
              fill="var(--bg-app)"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {hoveredIndex !== null && (
            <line
              x1={totalCoords[hoveredIndex].x}
              y1={paddingTop}
              x2={totalCoords[hoveredIndex].x}
              y2={paddingTop + chartHeight}
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              opacity="0.3"
              strokeDasharray="2 2"
              pointerEvents="none"
            />
          )}
        </svg>

        {hoveredIndex !== null && (
          <div
            className="chart-tooltip glass animate-fade-in"
            style={{
              left: `${(totalCoords[hoveredIndex].x / width) * 100}%`,
              top: `${(totalCoords[hoveredIndex].y / height) * 100 - 30}%`,
            }}
          >
            <h4>{weeklyData[hoveredIndex].week}</h4>
            <div className="tooltip-row">
              <span className="tooltip-dot bg-danger"></span>
              <span>Bugs: <strong>{totalBugsList[hoveredIndex]}</strong></span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-dot bg-success"></span>
              <span>Resueltos: <strong>{resolvedList[hoveredIndex]}</strong></span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .chart-container {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 2;
          min-width: 320px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chart-title-group h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .chart-title-group p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          font-weight: 550;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .color-bugs { background-color: var(--color-danger); }
        .color-resolved { background-color: var(--color-success); }

        .svg-wrapper {
          position: relative;
          width: 100%;
          height: 240px;
        }

        .chart-tooltip {
          position: absolute;
          padding: 10px;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          z-index: 10;
          pointer-events: none;
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 130px;
          box-shadow: var(--shadow-md);
        }

        .chart-tooltip h4 {
          font-size: 0.78rem;
          margin-bottom: 2px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 2px;
        }

        .tooltip-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tooltip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        
        .bg-danger { background-color: var(--color-danger); }
        .bg-success { background-color: var(--color-success); }
      `}</style>
    </div>
  );
}

interface DonutProps {
  kpis?: { erroresVisuales: number; retrabajo: number };
  weeklyData?: WeeklyTrend[];
}

export function BugCategoriesDonut({ kpis, weeklyData }: DonutProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Compute aggregate sums
  let totalErrores = 0;
  let totalRetrabajo = 0;

  if (kpis) {
    totalErrores = kpis.erroresVisuales;
    totalRetrabajo = kpis.retrabajo;
  } else if (weeklyData) {
    // If weekly data is given, use dummy categories or historical splits
    weeklyData.forEach((w) => {
      totalErrores += Math.round(w.totalBugs * 0.7);
      totalRetrabajo += Math.round(w.totalBugs * 0.3);
    });
  }

  const grandTotal = totalErrores + totalRetrabajo || 1;
  const categories = [
    { name: 'Errores Visuales', count: totalErrores, color: 'var(--color-danger)', percentage: (totalErrores / grandTotal) * 100 },
    { name: 'Retrabajo', count: totalRetrabajo, color: 'var(--color-warning)', percentage: (totalRetrabajo / grandTotal) * 100 }
  ];

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
                    transition: 'stroke-width 0.2s ease, stroke 0.2s ease',
                    cursor: 'pointer'
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
        }

        .center-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .center-text {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 2px;
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
        }

        .legend-values {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
        }

        .legend-count {
          color: var(--text-primary);
          font-weight: 600;
        }

        .legend-percent {
          color: var(--text-muted);
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}
