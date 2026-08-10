'use client';

import React from 'react';
import { DeveloperStat } from '../data/mockData';

interface DeveloperLeaderboardProps {
  developers: DeveloperStat[];
  highlightedDevId?: string;
}

export default function DeveloperLeaderboard({ developers, highlightedDevId }: DeveloperLeaderboardProps) {
  
  const getRatingColor = (rate: number) => {
    if (rate >= 90) return 'var(--color-success)';
    if (rate >= 80) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getFirstTryRate = (dev: DeveloperStat) => {
    if (!dev.totalTasks) return 0;
    return Math.round((dev.approvedFirstTry / dev.totalTasks) * 100);
  };

  // Sort developers by complianceRate desc
  const sortedDevs = [...developers].sort((a, b) => b.complianceRate - a.complianceRate);

  return (
    <div className="leaderboard-card glass">
      <div className="leaderboard-header">
        <h3>Productividad & Calidad de Desarrolladores No-Code</h3>
        <p>Ranking de cumplimiento normativo y resolución ágil de bugs por desarrollador</p>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-grid">
          {sortedDevs.map((dev, index) => {
            const firstTryRate = getFirstTryRate(dev);
            const ratingColor = getRatingColor(dev.complianceRate);

            const isHighlighted = !!highlightedDevId && dev.id === highlightedDevId;

            return (
              <div
                key={dev.name}
                className={`dev-card glass glass-interactive inspect-corners ${isHighlighted ? 'dev-card-highlighted' : ''}`}
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <div className="dev-rank">
                  <span>#{index + 1}</span>
                </div>

                <div className="dev-identity">
                  <div className="dev-avatar">
                    {dev.avatarUrl ? (
                      <img src={dev.avatarUrl} alt={dev.name} className="dev-avatar-img" />
                    ) : (
                      dev.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div className="dev-info">
                    <h4>{dev.name}</h4>
                    <span>{dev.role}</span>
                  </div>
                  {isHighlighted && <span className="dev-filtered-badge">Filtrado</span>}
                </div>

                <div className="dev-stats-row">
                  {/* Metric 1: First-try Pass */}
                  <div className="dev-stat-block">
                    <span className="block-label">Primer Intento</span>
                    <div className="stat-progress-group">
                      <span className="block-val">{firstTryRate}%</span>
                      <span className="block-sub">({dev.approvedFirstTry}/{dev.totalTasks} tareas)</span>
                    </div>
                    <div className="mini-track">
                      <div className="mini-fill" style={{ width: `${firstTryRate}%`, backgroundColor: 'var(--color-secondary)' }}></div>
                    </div>
                  </div>

                  {/* Metric 2: Compliance */}
                  <div className="dev-stat-block">
                    <span className="block-label">Cumplimiento Guías</span>
                    <div className="stat-progress-group">
                      <span className="block-val" style={{ color: ratingColor }}>{dev.complianceRate}%</span>
                      <span className="block-sub">score promedio</span>
                    </div>
                    <div className="mini-track">
                      <div className="mini-fill" style={{ width: `${dev.complianceRate}%`, backgroundColor: ratingColor }}></div>
                    </div>
                  </div>

                  {/* Metric 3: Calidad Visual */}
                  <div className="dev-stat-block">
                    <span className="block-label">Calidad Visual</span>
                    <div className="stat-progress-group">
                      <span className="block-val" style={{ color: getRatingColor(dev.kpisTotal.calidadVisual) }}>
                        {dev.kpisTotal.calidadVisual}%
                      </span>
                      <span className="block-sub">acabado UI</span>
                    </div>
                    <div className="mini-track">
                      <div
                        className="mini-fill"
                        style={{
                          width: `${dev.kpisTotal.calidadVisual}%`,
                          backgroundColor: getRatingColor(dev.kpisTotal.calidadVisual)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .leaderboard-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .leaderboard-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .leaderboard-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .leaderboard-content {
          display: flex;
          flex-direction: column;
        }

        .leaderboard-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dev-card {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-radius: var(--radius-sm);
          position: relative;
          gap: 24px;
          flex-wrap: wrap;
          opacity: 0;
          animation: rowIn 0.45s ease-out forwards;
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .dev-card {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        .dev-card-highlighted {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-glow), var(--shadow-glow);
        }

        .dev-filtered-badge {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--color-primary);
          background: var(--color-primary-glow);
          border: 1px solid var(--color-primary);
          border-radius: 999px;
          padding: 2px 8px;
          white-space: nowrap;
        }

        .dev-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dev-rank {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-muted);
          min-width: 32px;
        }

        .dev-identity {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 220px;
          flex: 1;
        }

        .dev-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--color-primary-glow);
          border: 1.5px solid var(--color-primary);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 750;
          font-size: 0.95rem;
        }

        .dev-info h4 {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .dev-info span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dev-stats-row {
          display: flex;
          gap: 24px;
          flex: 3;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .dev-stat-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
          flex: 1;
        }

        .block-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .stat-progress-group {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .block-val {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .block-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .mini-track {
          width: 100%;
          height: 4px;
          background-color: var(--border-color);
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 2px;
        }

        .mini-fill {
          height: 100%;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
