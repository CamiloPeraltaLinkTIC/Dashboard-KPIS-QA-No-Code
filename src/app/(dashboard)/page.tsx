'use client';

import React from 'react';
import MetricCard from '@/components/MetricCard';
import { BugCategoriesDonut } from '@/components/Charts';
import DeveloperSkillsBreakdown from '@/components/DeveloperSkillsBreakdown';
import RecentLogs from '@/components/RecentLogs';
import RecentObservations from '@/components/RecentObservations';
import ScoreHero from '@/components/ScoreHero';
import DeveloperLeaderboard from '@/components/DeveloperLeaderboard';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export default function OverviewPage() {
  const {
    developers,
    selectedDeveloper,
    selectedDeveloperData,
    stats,
    heroScore,
    heroBreakdown,
    allReviews,
    filteredReviews,
    handleDeleteReview,
    handleReopenReview,
    handleSelectObservation,
    logJumpTarget
  } = useDashboardData();

  return (
    <div className="view-pane animate-fade-in">
      <ScoreHero
        score={heroScore}
        scopeLabel={selectedDeveloper === 'All' ? 'Todo el equipo' : selectedDeveloper}
        breakdown={heroBreakdown}
      />

      {/* Developer Specific or Team KPIs */}
      <div className="kpi-cards-grid">
        <MetricCard
          delayMs={150}
          title="Píxel Perfecto"
          value={`${stats.kpisTotal.pixelPerfect}/100%`}
          subtext="Fidelidad respecto al diseño"
          trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
          trendType="positive"
          color="primary"
          sparklineData={stats.trendPixel}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />

        <MetricCard
          delayMs={210}
          title="Cumplimiento de DoD"
          value={`${stats.kpisTotal.cumplimientoDod}/100%`}
          subtext="Definición de Terminado"
          trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
          trendType="positive"
          color="success"
          sparklineData={stats.trendDod}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />

        <MetricCard
          delayMs={270}
          title="Calidad Visual"
          value={`${stats.kpisTotal.calidadVisual}/100%`}
          subtext="Consistencia y acabado UI"
          trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
          trendType="positive"
          color="success"
          sparklineData={stats.trendCalidad}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z" />
            </svg>
          }
        />

        <MetricCard
          delayMs={330}
          title="Errores Visuales y de Diseño"
          value={stats.erroresVisuales}
          subtext="Detectados por QA"
          trend={selectedDeveloper === 'All' ? "Total equipo" : "Histórico"}
          trendType="positive" // menos errores es positivo
          color="danger"
          sparklineData={stats.trendErrores}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect width="8" height="18" x="8" y="3" rx="4" />
              <path d="M6 10h12M6 14h12M4 7h16M2 17h20" />
            </svg>
          }
        />

        <MetricCard
          delayMs={390}
          title="Retrabajo"
          value={stats.retrabajo}
          subtext="Incidencias devueltas"
          trend={selectedDeveloper === 'All' ? "Total equipo" : "Re-trabajo"}
          trendType="positive"
          color="warning"
          sparklineData={stats.trendRework}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          }
        />
      </div>

      {/* Developer Competencies and Specific Bug charts */}
      <div className="charts-layout">
        <DeveloperSkillsBreakdown developers={developers} selectedDevId={selectedDeveloper === 'All' ? 'All' : selectedDeveloperData?.id} />
        <BugCategoriesDonut
          kpis={stats.kpisTotal}
          developersBreakdown={
            selectedDeveloper === 'All'
              ? developers.map((d) => ({ id: d.id, name: d.name, erroresVisuales: d.kpisTotal.erroresVisuales, retrabajo: d.kpisTotal.retrabajo }))
              : undefined
          }
        />
      </div>

      {/* Ranking Grid (Main focus) */}
      <DeveloperLeaderboard
        developers={developers}
        highlightedDevId={selectedDeveloper !== 'All' ? selectedDeveloperData?.id : undefined}
      />

      {/* Últimas 5 observaciones (solo con el filtro en "Todos") */}
      {selectedDeveloper === 'All' && (
        <RecentObservations reviews={allReviews.slice(0, 5)} onSelectReview={handleSelectObservation} />
      )}

      {/* Audit history list */}
      <RecentLogs
        logs={filteredReviews}
        onDeleteReview={handleDeleteReview}
        onReopenReview={handleReopenReview}
        jumpTarget={logJumpTarget}
      />

      <style jsx>{`
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .kpi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .charts-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .charts-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
