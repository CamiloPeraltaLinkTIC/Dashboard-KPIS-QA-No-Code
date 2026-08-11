import { describe, it, expect } from 'vitest';
import {
  countApprovedFirstTry,
  countReopenedRetrabajo,
  computeDevAggregates,
  linkRetests,
  computeHeroBreakdown
} from './reviewAggregates';
import { DeveloperReview } from '@/data/mockData';

function makeReview(overrides: Partial<DeveloperReview> & Pick<DeveloperReview, 'id'>): DeveloperReview {
  return {
    taskName: 'Tarea de prueba',
    date: '2026-01-01T00:00:00.000Z',
    score: 90,
    status: 'approved',
    kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 0 },
    details: '',
    qaAnalyst: 'QA',
    ...overrides
  };
}

describe('countApprovedFirstTry', () => {
  it('cuenta aprobadas sin parentReviewId', () => {
    const reviews = [
      makeReview({ id: '1', status: 'approved' }),
      makeReview({ id: '2', status: 'rejected' })
    ];
    expect(countApprovedFirstTry(reviews)).toBe(1);
  });

  it('no cuenta una aprobada que viene de un reintento (tiene parentReviewId)', () => {
    const reviews = [
      makeReview({ id: '1', status: 'in_review' }),
      makeReview({ id: '2', status: 'approved', parentReviewId: '1' })
    ];
    // Ninguna cuenta: la 1 no está aprobada, la 2 es un reintento.
    expect(countApprovedFirstTry(reviews)).toBe(0);
  });
});

describe('countReopenedRetrabajo', () => {
  it('cuenta cuántas revisiones son reintentos, no la suma de kpis.retrabajo', () => {
    const reviews = [
      makeReview({ id: '1', kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 0 } }),
      makeReview({ id: '2', parentReviewId: '1', kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 1 } }),
      makeReview({ id: '3', parentReviewId: '2', kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 2 } })
    ];
    // 2 reaperturas (id 2 y 3 tienen parentReviewId), no 0+1+2=3.
    expect(countReopenedRetrabajo(reviews)).toBe(2);
  });
});

describe('computeDevAggregates', () => {
  it('devuelve valores por defecto (100/0) cuando no hay revisiones', () => {
    const result = computeDevAggregates([]);
    expect(result.totalTasks).toBe(0);
    expect(result.complianceRate).toBe(100);
    expect(result.kpisTotal.pixelPerfect).toBe(100);
    expect(result.kpisTotal.retrabajo).toBe(0);
  });

  it('promedia score y KPIs de porcentaje, sin promediar errores/retrabajo', () => {
    const reviews = [
      makeReview({ id: '1', score: 80, kpis: { pixelPerfect: 80, cumplimientoDod: 90, calidadVisual: 100, erroresVisuales: 2, retrabajo: 0 } }),
      makeReview({ id: '2', score: 100, kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 1, retrabajo: 0 } })
    ];
    const result = computeDevAggregates(reviews);
    expect(result.totalTasks).toBe(2);
    expect(result.complianceRate).toBe(90); // (80+100)/2
    expect(result.kpisTotal.pixelPerfect).toBe(90); // (80+100)/2
    expect(result.kpisTotal.erroresVisuales).toBe(3); // suma, no promedio
  });
});

describe('linkRetests', () => {
  it('vincula original <-> reintento con retestOf/retestedBy', () => {
    const reviews = [
      makeReview({ id: 'rev-002', reviewCode: 'REV-2026-002', status: 'in_review', score: 78 }),
      makeReview({ id: 'rev-004', reviewCode: 'REV-2026-004', status: 'approved', score: 93, parentReviewId: 'rev-002' })
    ];
    const linked = linkRetests(reviews);
    const original = linked.find((r) => r.id === 'rev-002')!;
    const retry = linked.find((r) => r.id === 'rev-004')!;

    expect(retry.retestOf?.id).toBe('rev-002');
    expect(original.retestedBy?.id).toBe('rev-004');
  });

  it('una revisión del medio de la cadena tiene AMBOS campos a la vez (regresión: se pisaban entre sí)', () => {
    // 002 (original) -> 004 (reintento de 002) -> 005 (reintento de 004)
    const reviews = [
      makeReview({ id: 'rev-002', reviewCode: 'REV-2026-002', status: 'in_review' }),
      makeReview({ id: 'rev-004', reviewCode: 'REV-2026-004', status: 'approved', parentReviewId: 'rev-002' }),
      makeReview({ id: 'rev-005', reviewCode: 'REV-2026-005', status: 'approved', parentReviewId: 'rev-004' })
    ];
    const linked = linkRetests(reviews);
    const middle = linked.find((r) => r.id === 'rev-004')!;

    // 004 ES reintento de 002 (retestOf) Y YA tiene su propio reintento, 005 (retestedBy).
    expect(middle.retestOf?.id).toBe('rev-002');
    expect(middle.retestedBy?.id).toBe('rev-005');
  });
});

describe('computeHeroBreakdown', () => {
  it('una revisión aprobada sigue contando como aprobada aunque tenga un reintento posterior', () => {
    const reviews = linkRetests([
      makeReview({ id: '1', status: 'approved', parentReviewId: undefined }),
      makeReview({ id: '2', status: 'approved', parentReviewId: '1' }) // reintento de la 1
    ]);
    const breakdown = computeHeroBreakdown(reviews);
    expect(breakdown.approved).toBe(2);
    expect(breakdown.total).toBe(2);
  });

  it('una revisión "en revisión" o "rechazada" ya reabierta deja de contarse (la reemplaza su reintento)', () => {
    const reviews = linkRetests([
      makeReview({ id: '1', status: 'in_review' }),
      makeReview({ id: '2', status: 'approved', parentReviewId: '1' }) // reintento de la 1, resuelto
    ]);
    const breakdown = computeHeroBreakdown(reviews);
    expect(breakdown.inReview).toBe(0); // la 1 ya no cuenta como pendiente
    expect(breakdown.approved).toBe(1); // solo la 2
    expect(breakdown.total).toBe(2); // pero el total sí cuenta ambas evaluaciones reales
  });
});
