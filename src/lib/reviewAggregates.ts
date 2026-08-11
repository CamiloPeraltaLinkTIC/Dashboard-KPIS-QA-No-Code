import { DeveloperReview } from '@/data/mockData';

// No cuenta como "primer intento" si viene de un reintento (reabrir historial).
export function countApprovedFirstTry(reviews: DeveloperReview[]): number {
  return reviews.filter((r) => r.status === 'approved' && !r.parentReviewId).length;
}

// El total de "Retrabajo" cuenta cuántas veces se reabrió algo (cuántas
// revisiones tienen parentReviewId), no la suma de los valores de retrabajo
// de cada fila (que escala con la profundidad de la cadena: 1, 2, 3...).
export function countReopenedRetrabajo(reviews: DeveloperReview[]): number {
  return reviews.filter((r) => !!r.parentReviewId).length;
}

export interface DevAggregates {
  totalTasks: number;
  approvedFirstTry: number;
  complianceRate: number;
  kpisTotal: {
    pixelPerfect: number;
    cumplimientoDod: number;
    calidadVisual: number;
    erroresVisuales: number;
    retrabajo: number;
  };
}

export function computeDevAggregates(reviews: DeveloperReview[]): DevAggregates {
  const totalTasks = reviews.length;
  const approvedFirstTry = countApprovedFirstTry(reviews);
  const complianceRate = totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / totalTasks) : 100;

  const kpisTotal = {
    pixelPerfect: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.pixelPerfect, 0) / totalTasks) : 100,
    cumplimientoDod: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.cumplimientoDod, 0) / totalTasks) : 100,
    calidadVisual: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.calidadVisual, 0) / totalTasks) : 100,
    erroresVisuales: reviews.reduce((sum, r) => sum + r.kpis.erroresVisuales, 0),
    retrabajo: countReopenedRetrabajo(reviews),
  };

  return { totalTasks, approvedFirstTry, complianceRate, kpisTotal };
}

// Vincula cada revisión con su reintento/original (reabrir historial) para
// mostrar ambos puntajes juntos en el detalle, sin afectar los agregados.
// Van en dos campos separados (retestOf / retestedBy) porque una revisión
// "de en medio" de la cadena puede ser ambas cosas a la vez: si se guardaran
// en un solo campo, el segundo cálculo pisaría al primero. Muta y devuelve
// el mismo array (mismo comportamiento que antes de extraerlo).
export function linkRetests<T extends DeveloperReview>(reviews: T[]): T[] {
  const byId = new Map(reviews.map((r) => [r.id, r] as [string, T]));
  reviews.forEach((r) => {
    if (r.parentReviewId) {
      const parent = byId.get(r.parentReviewId);
      if (parent) {
        r.retestOf = { id: parent.id, reviewCode: parent.reviewCode, score: parent.score, date: parent.date };
        parent.retestedBy = { id: r.id, reviewCode: r.reviewCode, score: r.score, date: r.date };
      }
    }
  });
  return reviews;
}

export interface HeroBreakdown {
  approved: number;
  inReview: number;
  rejected: number;
  total: number;
}

// Una revisión "En Revisión" o "Rechazada" que ya fue reabierta y resuelta
// con un reintento no debe seguir contando como pendiente para siempre.
// Pero una revisión "Aprobada" sí sigue contando como aprobada aunque
// después se haya reabierto otra vez (por ejemplo, para un ajuste
// adicional) — aprobar es un resultado válido que no queda "obsoleto".
// El total, en cambio, cuenta cada evaluación realizada (incluidas las
// reabiertas), porque representa el trabajo real de QA, no el estado
// actual de cada tarea.
export function computeHeroBreakdown<T extends DeveloperReview>(reviews: T[]): HeroBreakdown {
  const current = reviews.filter((r) => r.status === 'approved' || !r.retestedBy);
  const approved = current.filter((r) => r.status === 'approved').length;
  const inReview = current.filter((r) => r.status === 'in_review').length;
  const rejected = current.filter((r) => r.status === 'rejected').length;
  return { approved, inReview, rejected, total: reviews.length };
}
