'use client';

import React from 'react';
import InteractiveValidator from '@/components/InteractiveValidator';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export default function CalificarPage() {
  const {
    handleAddReview,
    developersDropdown,
    allProjects,
    projectAssignments,
    preselectedDevId,
    reopenContext,
    clearReopenContext
  } = useDashboardData();

  return (
    <div className="view-pane animate-fade-in">
      <InteractiveValidator
        onAddReview={handleAddReview}
        developers={developersDropdown}
        projects={allProjects}
        assignments={projectAssignments}
        preselectedDevId={preselectedDevId}
        reopenContext={reopenContext}
        onReopenHandled={clearReopenContext}
      />

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
