export interface ReviewKpis {
  pixelPerfect: number;
  cumplimientoDod: number;
  calidadVisual: number;
  erroresVisuales: number;
  retrabajo: number;
}

export type ReviewStatus = 'approved' | 'rejected' | 'in_review';

// El score se calcula a partir de los KPIs: promedio de los porcentajes menos penalizaciones.
export function calculateReviewScore(kpis: ReviewKpis): number {
  const baseScore = Math.round((kpis.pixelPerfect + kpis.cumplimientoDod + kpis.calidadVisual) / 3);
  const scoreDeduction = (kpis.erroresVisuales * 2) + (kpis.retrabajo * 5);
  return Math.max(0, baseScore - scoreDeduction);
}

export function deriveReviewStatus(score: number): ReviewStatus {
  if (score >= 85) return 'approved';
  if (score < 75) return 'rejected';
  return 'in_review';
}
