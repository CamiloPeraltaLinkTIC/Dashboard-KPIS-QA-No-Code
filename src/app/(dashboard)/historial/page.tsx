'use client';

import React from 'react';
import RecentLogs from '@/components/RecentLogs';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export default function HistorialPage() {
  const { filteredReviews, handleDeleteReview, handleReopenReview } = useDashboardData();

  return (
    <div className="view-pane animate-fade-in">
      <RecentLogs logs={filteredReviews} onDeleteReview={handleDeleteReview} onReopenReview={handleReopenReview} />

      <style jsx>{`
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
