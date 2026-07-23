'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a supabase client with the service role key to bypass RLS and create users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function createNewUser(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in the server environment.' };
  }

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const assignedQaId = formData.get('assignedQaId') as string;

  if (!username || !password || !role) {
    return { success: false, error: 'Faltan campos requeridos.' };
  }

  const email = `${username.trim()}@yopmail.com`;

  try {
    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Error desconocido al crear usuario en Supabase Auth.' };
    }

    // 2. The trigger `on_auth_user_created_nocode` will have created the profile automatically.
    // However, it creates it with role 'dev' (or 'admin' if admin@yopmail.com).
    // We need to update the profile with the selected role and QA assignment.
    
    // Give it a brief delay to ensure trigger has executed (usually synchronous in Postgres, but just in case)
    await new Promise(resolve => setTimeout(resolve, 500));

    const updateData: any = { role };
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
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in the server environment.' };
  }

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
        return { success: false, error: `Error actualizando contraseña: ${authError.message}` };
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

export async function createProject(formData: FormData) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in the server environment.' };
  }

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

export async function deleteProject(projectId: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' };
  }

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
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' };
  }

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

    return { success: true, message: 'Asignación creada exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAssignment(assignmentId: string) {
  if (!supabaseServiceKey) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' };
  }

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
