import { describe, it, expect } from 'vitest';
import { resolveEmail } from './email';

describe('resolveEmail', () => {
  it('agrega el dominio interno cuando es solo un username', () => {
    expect(resolveEmail('juan.perez')).toBe('juan.perez@yopmail.com');
  });

  it('respeta un correo real tal cual (en minúsculas)', () => {
    expect(resolveEmail('Juan.Perez@empresa.com')).toBe('juan.perez@empresa.com');
  });

  it('recorta espacios en blanco', () => {
    expect(resolveEmail('  juan.perez  ')).toBe('juan.perez@yopmail.com');
  });
});
