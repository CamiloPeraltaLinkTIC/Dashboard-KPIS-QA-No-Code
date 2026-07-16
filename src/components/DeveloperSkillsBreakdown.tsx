'use client';

import React from 'react';
import { DeveloperStat } from '../data/mockData';

interface DeveloperSkillsBreakdownProps {
  developers: DeveloperStat[];
  selectedDevId?: string;
}

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

  const getBarColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 80) return 'var(--color-primary)';
    if (score >= 70) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const skillItems = [
    {
      key: 'structure',
      label: 'Estructura & Nomenclatura',
      score: aggregatedSkills.structure,
      desc: 'Nombres de variables, limpieza de elementos huérfanos, ordenación.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

      <div className="skills-list">
        {skillItems.map((skill) => {
          const color = getBarColor(skill.score);
          return (
            <div key={skill.key} className="skill-row">
              <div className="skill-meta-group">
                <div className="skill-icon-box" style={{ color: color, background: `${color}15` }}>
                  {skill.icon}
                </div>
                <div className="skill-titles">
                  <h4>{skill.label}</h4>
                  <p>{skill.desc}</p>
                </div>
                <div className="skill-score" style={{ color: color }}>
                  {skill.score}%
                </div>
              </div>

              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill animate-width"
                  style={{
                    width: `${skill.score}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}30`
                  }}
                ></div>
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

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skill-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skill-meta-group {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .skill-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .skill-titles {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .skill-titles h4 {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .skill-titles p {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .skill-score {
          font-size: 0.95rem;
          font-weight: 750;
        }

        .skill-bar-track {
          width: 100%;
          height: 6px;
          background-color: var(--border-color);
          border-radius: 9999px;
          overflow: hidden;
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
