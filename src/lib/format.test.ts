import { describe, it, expect } from 'vitest';
import { formatDateTime } from './format';

describe('formatDateTime', () => {
  it('devuelve string vacío para entrada vacía', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('devuelve el valor original si no es una fecha válida', () => {
    expect(formatDateTime('no-es-una-fecha')).toBe('no-es-una-fecha');
  });

  it('formatea una fecha ISO válida incluyendo día, mes y año', () => {
    const result = formatDateTime('2026-07-24T14:30:00.000Z');
    expect(result).not.toBe('2026-07-24T14:30:00.000Z');
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/24/);
  });
});
