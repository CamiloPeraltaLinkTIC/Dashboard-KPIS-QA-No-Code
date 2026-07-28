// Convierte lo que el usuario escriba en el campo "Usuario" a un email válido
// para Supabase Auth: si ya parece un correo (tiene "@"), se usa tal cual
// (dominio real); si es solo un username, se le agrega el dominio interno.
export function resolveEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : `${trimmed}@yopmail.com`;
}
