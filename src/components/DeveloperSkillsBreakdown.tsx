'use client';

import React from 'react';
import { DeveloperStat } from '../data/mockData';

interface DeveloperSkillsBreakdownProps {
  developers: DeveloperStat[];
  selectedDevId?: string;
}

type Tier = 'success' | 'primary' | 'warning' | 'danger';

const TIER_GRADIENT: Record<Tier, string> = {
  success: 'linear-gradient(90deg, hsla(var(--hue-success), 70%, 45%, 0.6), hsl(var(--hue-success), 70%, 45%))',
  primary: 'linear-gradient(90deg, hsla(var(--hue-primary), 85%, 64%, 0.6), hsl(var(--hue-primary), 85%, 64%))',
  warning: 'linear-gradient(90deg, hsla(var(--hue-warning), 85%, 55%, 0.6), hsl(var(--hue-warning), 85%, 55%))',
  danger: 'linear-gradient(90deg, hsla(var(--hue-danger), 85%, 55%, 0.6), hsl(var(--hue-danger), 85%, 55%))',
};

const TIER_COLOR_VAR: Record<Tier, string> = {
  success: 'var(--color-success)',
  primary: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

export default function DeveloperSkillsBreakdown({ developers, selectedDevId }: DeveloperSkillsBreakdownProps) {
  // Aggregate calculations
  const aggregatedSkills = React.useMemo(() => {
    let devList = developers;
    if (selectedDevId && selectedDevId !== 'All') {
      devList = developers.filter(d => d.id === selectedDevId);
    }

    if (devList.length === 0) {
      return { structure: 0, performance: 0, security: 0, ux: 0 };
    }

    let structureSum = 0;
    let performanceSum = 0;
    let securitySum = 0;
    let uxSum = 0;

    devList.forEach((d) => {
      structureSum += d.skillsScore.structure;
      performanceSum += d.skillsScore.performance;
      securitySum += d.skillsScore.security;
      uxSum += d.skillsScore.ux;
    });

    const count = devList.length;
    return {
      structure: Math.round(structureSum / count),
      performance: Math.round(performanceSum / count),
      security: Math.round(securitySum / count),
      ux: Math.round(uxSum / count)
    };
  }, [developers, selectedDevId]);

  const getTier = (score: number): Tier => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const skillItems = [
    {
      key: 'structure',
      label: 'Estructura & Nomenclatura',
      score: aggregatedSkills.structure,
      desc: 'Nombres de variables, limpieza de elementos huérfanos, ordenación.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    },
    {
      key: 'performance',
      label: 'Rendimiento & Optimización',
      score: aggregatedSkills.performance,
      desc: 'Búsquedas de base de datos eficientes, reducción de loops y APIs.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    },
    {
      key: 'security',
      label: 'Seguridad & Manejo de Errores',
      score: aggregatedSkills.security,
      desc: 'Privacy Rules, cifrado de API keys, rutas alternativas de fallas.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      key: 'ux',
      label: 'Responsividad & UX',
      score: aggregatedSkills.ux,
      desc: 'Adaptación a móvil, loaders interactivos, manejo de errores visible.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      )
    }
  ];

  return (
    <div className="skills-card glass">
      <div className="skills-header">
        <h3>Evaluación de Competencias Técnicas</h3>
        <p>Promedio de calificación en los 4 pilares de desarrollo del equipo</p>
      </div>

      <div className="skills-grid">
        {skillItems.map((skill, index) => {
          const tier = getTier(skill.score);
          const colorVar = TIER_COLOR_VAR[tier];
          return (
            <div
              key={skill.key}
              className={`skill-tile inspect-corners tier-${tier}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="skill-tile-top">
                <div className="skill-icon-box">{skill.icon}</div>
                <span className="skill-tile-score" style={{ color: colorVar }}>
                  {skill.score}<span className="skill-tile-unit">%</span>
                </span>
              </div>

              <h4>{skill.label}</h4>
              <p>{skill.desc}</p>

              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill"
                  style={{ width: `${skill.score}%`, background: TIER_GRADIENT[tier] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .skills-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skills-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .skills-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }

        .skill-tile {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
          opacity: 0;
          animation: skillTileIn 0.45s ease-out forwards;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        [data-theme="light"] .skill-tile {
          background: rgba(0, 0, 0, 0.015);
        }

        .skill-tile:hover {
          transform: translateY(-2px);
        }

        @keyframes skillTileIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .skill-tile {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        .skill-tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .skill-icon-box {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tier-success .skill-icon-box {
          color: var(--color-success);
          background: linear-gradient(135deg, hsla(var(--hue-success), 70%, 45%, 0.24), hsla(var(--hue-success), 70%, 45%, 0.05));
          border: 1px solid hsla(var(--hue-success), 70%, 45%, 0.2);
        }

        .tier-primary .skill-icon-box {
          color: var(--color-primary);
          background: linear-gradient(135deg, hsla(var(--hue-primary), 85%, 64%, 0.24), hsla(var(--hue-primary), 85%, 64%, 0.05));
          border: 1px solid hsla(var(--hue-primary), 85%, 64%, 0.2);
        }

        .tier-warning .skill-icon-box {
          color: var(--color-warning);
          background: linear-gradient(135deg, hsla(var(--hue-warning), 85%, 55%, 0.24), hsla(var(--hue-warning), 85%, 55%, 0.05));
          border: 1px solid hsla(var(--hue-warning), 85%, 55%, 0.2);
        }

        .tier-danger .skill-icon-box {
          color: var(--color-danger);
          background: linear-gradient(135deg, hsla(var(--hue-danger), 85%, 55%, 0.24), hsla(var(--hue-danger), 85%, 55%, 0.05));
          border: 1px solid hsla(var(--hue-danger), 85%, 55%, 0.2);
        }

        .skill-tile-score {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
        }

        .skill-tile-unit {
          font-size: 0.75rem;
          opacity: 0.75;
        }

        .skill-tile h4 {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .skill-tile p {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.35;
          flex: 1;
        }

        .skill-bar-track {
          width: 100%;
          height: 6px;
          background-color: var(--border-color);
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 2px;
        }

        .skill-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
