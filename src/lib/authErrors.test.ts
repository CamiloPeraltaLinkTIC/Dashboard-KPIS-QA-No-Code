import { describe, it, expect } from 'vitest';
import { translateAuthError } from './authErrors';

describe('translateAuthError', () => {
  it('traduce un mensaje conocido exacto', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Usuario o contraseña incorrectos.');
  });

  it('traduce cuando el mensaje conocido viene dentro de un texto más largo', () => {
    expect(translateAuthError('Error: User already registered in system')).toBe('Ese usuario ya está registrado.');
  });

  it('devuelve el mensaje original si no hay traducción', () => {
    expect(translateAuthError('Algo raro pasó')).toBe('Algo raro pasó');
  });

  it('devuelve un mensaje genérico si no hay mensaje', () => {
    expect(translateAuthError(null)).toBe('Ocurrió un error inesperado.');
    expect(translateAuthError(undefined)).toBe('Ocurrió un error inesperado.');
  });
});
