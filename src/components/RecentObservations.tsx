'use client';

import React from 'react';
import { DeveloperReview } from '../data/mockData';
import { formatDateTime } from '@/lib/format';

interface ObservationItem extends DeveloperReview {
  developerName: string;
}

interface RecentObservationsProps {
  reviews: ObservationItem[];
  onSelectReview?: (reviewId: string) => void;
}

export default function RecentObservations({ reviews, onSelectReview }: RecentObservationsProps) {
  if (reviews.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 80) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="observations-card glass">
      <div className="observations-header">
        <h3>Observaciones Recientes</h3>
        <p>Comentarios de QA en las últimas {reviews.length} revisiones de todo el equipo</p>
      </div>

      <div className="observations-list">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className={`observation-item ${onSelectReview ? 'clickable' : ''}`}
            onClick={() => onSelectReview?.(rev.id)}
            role={onSelectReview ? 'button' : undefined}
            tabIndex={onSelectReview ? 0 : undefined}
            onKeyDown={(e) => {
              if (onSelectReview && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectReview(rev.id);
              }
            }}
          >
            <div className="observation-marker" style={{ backgroundColor: getScoreColor(rev.score) }} />
            <div className="observation-body">
              <div className="observation-meta-row">
                <span className="observation-id">{rev.reviewCode || rev.id}</span>
                <strong className="observation-dev">{rev.developerName}</strong>
                <span className="observation-task">{rev.taskName}</span>
                <span className="observation-score" style={{ color: getScoreColor(rev.score) }}>
                  {rev.score}/100
                </span>
                <span className="observation-date">{formatDateTime(rev.date)}</span>
              </div>
              <p className="observation-text">{rev.details || 'Sin observaciones registradas.'}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .observations-card {
          padding: 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .observations-header h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .observations-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .observations-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .observation-item {
          display: flex;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .observation-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .observation-item.clickable {
          cursor: pointer;
          border-radius: var(--radius-sm);
          border-left: 2px solid transparent;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          margin: -6px -8px;
          padding: 6px 8px 20px 10px;
        }

        .observation-item.clickable:hover,
        .observation-item.clickable:focus-visible {
          background: var(--color-primary-glow);
          border-left-color: var(--color-primary);
          transform: translateX(3px);
          outline: none;
        }

        .observation-item.clickable:last-child {
          padding-bottom: 6px;
        }

        .observation-id {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .observation-marker {
          width: 6px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .observation-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .observation-meta-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .observation-dev {
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        .observation-task {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .observation-score {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.8rem;
        }

        .observation-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-left: auto;
        }

        .observation-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
