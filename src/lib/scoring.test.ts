import { describe, it, expect } from 'vitest';
import { calculateReviewScore, deriveReviewStatus } from './scoring';

describe('calculateReviewScore', () => {
  it('promedia los 3 KPIs de porcentaje cuando no hay penalizaciones', () => {
    const score = calculateReviewScore({
      pixelPerfect: 100,
      cumplimientoDod: 100,
      calidadVisual: 100,
      erroresVisuales: 0,
      retrabajo: 0
    });
    expect(score).toBe(100);
  });

  it('resta 2 puntos por cada error visual', () => {
    const score = calculateReviewScore({
      pixelPerfect: 100,
      cumplimientoDod: 100,
      calidadVisual: 100,
      erroresVisuales: 3,
      retrabajo: 0
    });
    expect(score).toBe(94); // 100 - 3*2
  });

  it('resta 5 puntos por cada unidad de retrabajo (penalización más pesada que un error)', () => {
    const score = calculateReviewScore({
      pixelPerfect: 100,
      cumplimientoDod: 100,
      calidadVisual: 100,
      erroresVisuales: 0,
      retrabajo: 2
    });
    expect(score).toBe(90); // 100 - 2*5
  });

  it('nunca baja de 0 aunque las penalizaciones superen la base', () => {
    const score = calculateReviewScore({
      pixelPerfect: 50,
      cumplimientoDod: 50,
      calidadVisual: 50,
      erroresVisuales: 0,
      retrabajo: 20
    });
    expect(score).toBe(0);
  });
});

describe('deriveReviewStatus', () => {
  it('aprueba con score >= 85', () => {
    expect(deriveReviewStatus(85)).toBe('approved');
    expect(deriveReviewStatus(100)).toBe('approved');
  });

  it('rechaza con score < 75', () => {
    expect(deriveReviewStatus(74)).toBe('rejected');
    expect(deriveReviewStatus(0)).toBe('rejected');
  });

  it('deja en revisión el rango intermedio [75, 85)', () => {
    expect(deriveReviewStatus(75)).toBe('in_review');
    expect(deriveReviewStatus(84)).toBe('in_review');
  });
});
