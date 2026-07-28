'use server';

import { createClient } from '@supabase/supabase-js';
import { translateAuthError } from '@/lib/authErrors';
import { resolveEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a supabase client with the service role key to bypass RLS and create users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Verifica en el servidor (nunca confiando en datos del cliente) que quien invoca
// esta acción tiene una sesión válida y rol admin. El accessToken se valida
// criptográficamente contra Supabase Auth; no puede ser falsificado por el cliente.
async function requireAdmin(accessToken: string | null | undefined): Promise<{ error: string } | { userId: string }> {
  if (!accessToken) {
    return { error: 'No autenticado.' };
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !user) {
    return { error: 'Sesión inválida o expirada.' };
  }

  const { data: callerProfile, error: profileError } = await supabaseAdmin
    .from('nocode_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !callerProfile || !['admin', 'Administrator'].includes(callerProfile.role)) {
    return { error: 'No tienes permisos de administrador para realizar esta acción.' };
  }

  return { userId: user.id };
}

export async function createNewUser(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno del servidor.' };
  }

  const auth = await requireAdmin(formData.get('accessToken') as string);
  if ('error' in auth) return { success: false, error: auth.error };

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const assignedQaId = formData.get('assignedQaId') as string;
  const fullName = formData.get('fullName') as string;

  if (!username || !password || !role) {
    return { success: false, error: 'Faltan campos requeridos.' };
  }

  // Si el username escrito ya es un correo real (tiene "@"), se respeta tal
  // cual; si no, se usa el dominio interno.
  const email = resolveEmail(username);

  try {
    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    if (!authData.user) {
      return { success: false, error: 'Error desconocido al crear usuario en Supabase Auth.' };
    }

    // 2. The trigger `on_auth_user_created_nocode` will have created the profile automatically.
    // However, it creates it with role 'dev' (or 'admin' según la regla del trigger por email).
    // We need to update the profile with the selected role and QA assignment.
    
    // Give it a brief delay to ensure trigger has executed (usually synchronous in Postgres, but just in case)
    await new Promise(resolve => setTimeout(resolve, 500));

    const updateData: any = { role, full_name: fullName || null };
    if (role === 'dev' && assignedQaId) {
      updateData.assigned_qa_id = assignedQaId;
    }

    const { error: profileError } = await supabaseAdmin
      .from('nocode_profiles')
      .update(updateData)
      .eq('id', authData.user.id);

    if (profileError) {
      return { success: false, error: `Usuario creado, pero hubo un error actualizando su perfil: ${profileError.message}` };
    }

    return { success: true, message: `Usuario ${username} creado exitosamente con el rol ${role}.` };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado del servidor.' };
  }
}

export async function updateUser(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno del servidor.' };
  }

  const auth = await requireAdmin(formData.get('accessToken') as string);
  if ('error' in auth) return { success: false, error: auth.error };

  const userId = formData.get('userId') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;
  const assignedQaId = formData.get('assignedQaId') as string;
  const password = formData.get('password') as string;

  if (!userId || !role) {
    return { success: false, error: 'Faltan campos requeridos.' };
  }

  try {
    // 1. If password is provided, reset it in auth.users
    if (password && password.trim().length >= 6) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password.trim()
      });
      if (authError) {
        return { success: false, error: `Error actualizando contraseña: ${translateAuthError(authError.message)}` };
      }
    }

    // 2. Update the profile in nocode_profiles
    const updateData: any = { 
      role, 
      full_name: fullName || null 
    };

    if (role === 'dev') {
      updateData.assigned_qa_id = assignedQaId || null;
    } else {
      updateData.assigned_qa_id = null;
    }

    const { error: profileError } = await supabaseAdmin
      .from('nocode_profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      return { success: false, error: `Error al actualizar perfil: ${profileError.message}` };
    }

    return { success: true, message: 'Usuario actualizado exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado del servidor.' };
  }
}

export async function deleteUser(userId: string, accessToken: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' };
  }

  const auth = await requireAdmin(accessToken);
  if ('error' in auth) return { success: false, error: auth.error };

  if (!userId) {
    return { success: false, error: 'Falta el usuario a eliminar.' };
  }

  if (userId === auth.userId) {
    return { success: false, error: 'No puedes eliminar tu propia cuenta.' };
  }

  try {
    // No se borra un usuario con historial de auditorías (como dev evaluado o
    // como QA evaluador): se perdería ese registro sin aviso. Hay que borrar
    // esas calificaciones primero desde "Historial de Auditorías" si de
    // verdad se quiere eliminar la cuenta.
    const { count, error: kpiCheckError } = await supabaseAdmin
      .from('nocode_kpis')
      .select('id', { count: 'exact', head: true })
      .or(`developer_id.eq.${userId},qa_analyst_id.eq.${userId}`);

    if (kpiCheckError) {
      return { success: false, error: `Error verificando historial: ${kpiCheckError.message}` };
    }
    if (count && count > 0) {
      return { success: false, error: `No se puede eliminar: este usuario tiene ${count} calificación(es) en el historial de auditorías. Elimínalas primero si de verdad quieres borrar la cuenta.` };
    }

    // Libera a cualquier dev que tuviera a este usuario como QA principal.
    await supabaseAdmin
      .from('nocode_profiles')
      .update({ assigned_qa_id: null })
      .eq('assigned_qa_id', userId);

    // El perfil referencia a auth.users sin cascada: hay que borrarlo primero.
    const { error: profileDeleteError } = await supabaseAdmin
      .from('nocode_profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      return { success: false, error: `Error al eliminar el perfil: ${profileDeleteError.message}` };
    }

    // Este proyecto de Supabase tiene además una tabla "profiles" (genérica,
    // de otra app/plantilla que comparte el mismo proyecto) con su propia
    // foreign key a auth.users. Si queda una fila ahí, el borrado de abajo
    // falla con "violates foreign key constraint profiles_id_fkey". Se
    // limpia también, best-effort (no bloquea si la tabla no existe o no
    // hay fila).
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return { success: false, error: `El perfil se eliminó, pero falló el borrado de la cuenta de acceso: ${authDeleteError.message}` };
    }

    return { success: true, message: 'Usuario eliminado exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado del servidor.' };
  }
}

export async function createProject(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno del servidor.' };
  }

  const auth = await requireAdmin(formData.get('accessToken') as string);
  if ('error' in auth) return { success: false, error: auth.error };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) {
    return { success: false, error: 'El nombre del proyecto es obligatorio.' };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('nocode_projects')
      .insert([{ name: name.trim(), description: description?.trim() }])
      .select()
      .single();

    if (error) {
      return { success: false, error: `Error al crear proyecto: ${error.message}` };
    }

    return { success: true, message: `Proyecto "${name}" creado exitosamente.` };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado.' };
  }
}

export async function deleteProject(projectId: string, accessToken: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' };
  }

  const auth = await requireAdmin(accessToken);
  if ('error' in auth) return { success: false, error: auth.error };

  try {
    const { error } = await supabaseAdmin
      .from('nocode_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      return { success: false, error: `Error al eliminar proyecto: ${error.message}` };
    }

    return { success: true, message: 'Proyecto eliminado exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAssignment(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' };
  }

  const auth = await requireAdmin(formData.get('accessToken') as string);
  if ('error' in auth) return { success: false, error: auth.error };

  const developerId = formData.get('developerId') as string;
  const qaId = formData.get('qaId') as string;
  const projectId = formData.get('projectId') as string;

  if (!developerId || !qaId || !projectId) {
    return { success: false, error: 'Faltan campos requeridos para la asignación.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('nocode_project_assignments')
      .insert([{ developer_id: developerId, qa_id: qaId, project_id: projectId }]);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Esta asignación exacta de Dev, QA y Proyecto ya existe.' };
      }
      return { success: false, error: `Error al crear asignación: ${error.message}` };
    }

    // La RLS controla la visibilidad del QA por `assigned_qa_id`. Alineamos ese campo
    // con la asignación para que el QA vea al desarrollador (y sus KPIs) sin cerrar sesión.
    await supabaseAdmin
      .from('nocode_profiles')
      .update({ assigned_qa_id: qaId })
      .eq('id', developerId);

    return { success: true, message: 'Asignación creada exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteKpiReview(reviewId: string, accessToken: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' };
  }

  if (!reviewId || !accessToken) {
    return { success: false, error: 'Faltan datos para eliminar la calificación.' };
  }

  try {
    // El historial de auditorías es información sensible: se verifica en el
    // servidor (a partir de una sesión validada criptográficamente, no de un
    // id que mande el cliente) que quien pide el borrado sea realmente admin.
    const auth = await requireAdmin(accessToken);
    if ('error' in auth) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
      .from('nocode_kpis')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return { success: false, error: `Error al eliminar la calificación: ${error.message}` };
    }

    return { success: true, message: 'Calificación eliminada del historial.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado.' };
  }
}

export async function deleteAssignment(assignmentId: string, accessToken: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada.' };
  }

  const auth = await requireAdmin(accessToken);
  if ('error' in auth) return { success: false, error: auth.error };

  try {
    const { error } = await supabaseAdmin
      .from('nocode_project_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      return { success: false, error: `Error al eliminar asignación: ${error.message}` };
    }

    return { success: true, message: 'Asignación eliminada exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
