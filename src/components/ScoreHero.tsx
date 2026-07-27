'use client';

import React, { useEffect, useState } from 'react';

interface ScoreHeroProps {
  score: number;
  scopeLabel: string;
  breakdown: { approved: number; inReview: number; rejected: number; total: number };
}

export default function ScoreHero({ score, scopeLabel, breakdown }: ScoreHeroProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Revela el anillo desde 0 al montar (o al cambiar de scope/refrescar datos),
  // usando transition (no keyframes) para que siga siendo correcto si el score
  // cambia en vivo por el auto-refresco cada 30s.
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayScore(score);
      return;
    }

    const raf = requestAnimationFrame(() => setDisplayScore(score));
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const getStatus = () => {
    if (score >= 90) return { label: 'Excelente', color: 'var(--color-success)' };
    if (score >= 80) return { label: 'Bueno', color: 'var(--color-primary)' };
    if (score >= 70) return { label: 'Requiere Atención', color: 'var(--color-warning)' };
    return { label: 'Crítico', color: 'var(--color-danger)' };
  };

  const status = getStatus();

  const radius = 68;
  const strokeWidth = 14;
  const center = 80;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, displayScore));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="hero-score-card glass inspect-corners">
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-ring-wrap">
        <svg width={center * 2} height={center * 2} viewBox={`0 0 ${center * 2} ${center * 2}`}>
          <circle cx={center} cy={center} r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth={strokeWidth} />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="url(#heroRingGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            transform={`rotate(-90 ${center} ${center})`}
          />
          <defs>
            <linearGradient id="heroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-secondary)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="hero-ring-label">
          <span className="hero-ring-value">{displayScore}</span>
          <span className="hero-ring-unit">/100</span>
        </div>
      </div>

      <div className="hero-info">
        <span className="hero-eyebrow">Score General de Calidad</span>
        <div className="hero-title-row">
          <h2 style={{ color: status.color }}>{status.label}</h2>
          <span className="hero-scope">{scopeLabel}</span>
        </div>

        <div className="hero-mini-stats">
          <div className="hero-mini-stat">
            <span className="mini-stat-value text-success">{breakdown.approved}</span>
            <span className="mini-stat-label">Aprobadas</span>
          </div>
          <div className="hero-mini-stat">
            <span className="mini-stat-value text-warning">{breakdown.inReview}</span>
            <span className="mini-stat-label">En Revisión</span>
          </div>
          <div className="hero-mini-stat">
            <span className="mini-stat-value text-danger">{breakdown.rejected}</span>
            <span className="mini-stat-label">Rechazadas</span>
          </div>
          <div className="hero-mini-stat">
            <span className="mini-stat-value">{breakdown.total}</span>
            <span className="mini-stat-label">Total Evaluaciones</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-score-card {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 36px;
          padding: 32px 36px;
          border-radius: var(--radius-lg);
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.08), hsla(190, 90%, 50%, 0.05)),
            var(--bg-card);
          opacity: 0;
          animation: heroIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-glow {
          position: absolute;
          top: -60%;
          right: -10%;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(190, 90%, 50%, 0.28), transparent 70%);
          filter: blur(70px);
          pointer-events: none;
        }

        .hero-ring-wrap {
          position: relative;
          width: 160px;
          height: 160px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-ring-label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .hero-ring-value {
          font-family: var(--font-display);
          font-size: 2.3rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .hero-ring-unit {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .hero-info {
          position: relative;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .hero-eyebrow {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-secondary);
        }

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-title-row h2 {
          font-size: 1.7rem;
          letter-spacing: -0.01em;
        }

        .hero-scope {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 3px 10px;
          border-radius: 999px;
        }

        [data-theme="light"] .hero-scope {
          background: rgba(0, 0, 0, 0.03);
        }

        .hero-mini-stats {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-color);
          padding-top: 14px;
        }

        .hero-mini-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mini-stat-value {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .mini-stat-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-danger { color: var(--color-danger); }

        @keyframes heroIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 700px) {
          .hero-score-card {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .hero-title-row {
            justify-content: center;
          }

          .hero-mini-stats {
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-score-card {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
