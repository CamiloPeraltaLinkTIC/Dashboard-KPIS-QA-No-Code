'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  color: 'primary' | 'success' | 'warning' | 'danger';
  sparklineData: number[];
  icon: React.ReactNode;
  delayMs?: number;
}

export default function MetricCard({
  title,
  value,
  subtext,
  trend,
  trendType,
  color,
  sparklineData,
  icon,
  delayMs = 0
}: MetricCardProps) {
  // Generate sparkline path SVG
  const width = 100;
  const height = 30;
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;
  
  const points = sparklineData
    .map((val, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3; // 3px padding top/bottom
      return `${x},${y}`;
    })
    .join(' ');

  const getThemeColor = () => {
    switch (color) {
      case 'primary': return 'var(--color-primary)';
      case 'success': return 'var(--color-success)';
      case 'warning': return 'var(--color-warning)';
      case 'danger': return 'var(--color-danger)';
    }
  };

  const getTrendBadgeClass = () => {
    if (trendType === 'positive') return 'badge-success';
    if (trendType === 'negative') return 'badge-danger';
    return 'badge-neutral';
  };

  return (
    <div className="metric-card glass glass-interactive inspect-corners" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="card-top">
        <div className="card-info">
          <span className="card-title">{title}</span>
          <h3 className="card-value">{value}</h3>
        </div>
        <div className={`card-icon-container color-${color}`}>
          {icon}
        </div>
      </div>

      <div className="card-bottom">
        <div className="trend-info">
          <span className={`badge ${getTrendBadgeClass()}`}>
            {trendType === 'positive' && '↑ '}
            {trendType === 'negative' && '↓ '}
            {trend}
          </span>
          <span className="card-subtext">{subtext}</span>
        </div>

        {/* Sparkline */}
        <div className="sparkline-container" title="Tendencia últimas revisiones">
          <svg width={width} height={height}>
            <path
              className="spark-path"
              d={`M ${points}`}
              fill="none"
              stroke={getThemeColor()}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              style={{ animationDelay: `${delayMs + 350}ms` }}
            />
            {/* Soft gradient fill under sparkline */}
            <path
              d={`M 0,${height} L ${points} L ${width},${height} Z`}
              fill={`url(#grad-${color})`}
              opacity="0.15"
            />
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getThemeColor()} />
                <stop offset="100%" stopColor={getThemeColor()} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <style jsx>{`
        .metric-card {
          padding: 20px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-width: 220px;
          opacity: 0;
          animation: cardEnter 0.5s ease-out forwards;
        }

        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spark-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: sparkDraw 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes sparkDraw {
          to { stroke-dashoffset: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .metric-card {
            animation: none !important;
            opacity: 1 !important;
          }
          .spark-path {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-value {
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .card-icon-container {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-primary {
          background: linear-gradient(135deg, hsla(var(--hue-primary), 85%, 64%, 0.24), hsla(var(--hue-primary), 85%, 64%, 0.05));
          color: var(--color-primary);
          border: 1px solid hsla(var(--hue-primary), 85%, 64%, 0.2);
        }

        .color-success {
          background: linear-gradient(135deg, hsla(var(--hue-success), 70%, 45%, 0.24), hsla(var(--hue-success), 70%, 45%, 0.05));
          color: var(--color-success);
          border: 1px solid hsla(var(--hue-success), 70%, 45%, 0.2);
        }

        .color-warning {
          background: linear-gradient(135deg, hsla(var(--hue-warning), 85%, 55%, 0.24), hsla(var(--hue-warning), 85%, 55%, 0.05));
          color: var(--color-warning);
          border: 1px solid hsla(var(--hue-warning), 85%, 55%, 0.2);
        }

        .color-danger {
          background: linear-gradient(135deg, hsla(var(--hue-danger), 85%, 55%, 0.24), hsla(var(--hue-danger), 85%, 55%, 0.05));
          color: var(--color-danger);
          border: 1px solid hsla(var(--hue-danger), 85%, 55%, 0.2);
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .trend-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-subtext {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .sparkline-container {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
