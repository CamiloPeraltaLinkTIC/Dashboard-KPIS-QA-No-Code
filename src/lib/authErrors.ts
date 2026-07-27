// Supabase Auth devuelve sus mensajes de error en inglés. Esta tabla traduce
// los más comunes para que el usuario final siempre vea español.
const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  'Invalid login credentials': 'Usuario o contraseña incorrectos.',
  'Email not confirmed': 'Esta cuenta aún no ha sido confirmada.',
  'User already registered': 'Ese usuario ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'User not found': 'Usuario no encontrado.',
  'Email rate limit exceeded': 'Se superó el límite de intentos. Intenta de nuevo más tarde.',
  'Too many requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
  'Network request failed': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
};

export function translateAuthError(message?: string | null): string {
  if (!message) return 'Ocurrió un error inesperado.';

  if (AUTH_ERROR_TRANSLATIONS[message]) return AUTH_ERROR_TRANSLATIONS[message];

  const match = Object.keys(AUTH_ERROR_TRANSLATIONS).find((key) => message.includes(key));
  return match ? AUTH_ERROR_TRANSLATIONS[match] : message;
}
