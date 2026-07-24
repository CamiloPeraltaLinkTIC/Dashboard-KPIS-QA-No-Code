/**
 * Formatea un timestamp ISO a fecha y hora legible (es-CO), ej. "24/07/2026, 14:30".
 * Si el valor no es una fecha válida, devuelve el original sin romper la UI.
 */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
