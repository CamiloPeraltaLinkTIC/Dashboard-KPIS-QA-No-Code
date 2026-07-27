'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  createNewUser, 
  updateUser, 
  createProject, 
  deleteProject, 
  createAssignment, 
  deleteAssignment 
} from '@/app/actions/admin';

type QAProfile = {
  id: string;
  username: string;
};

type ProfileItem = {
  id: string;
  email: string;
  username: string;
  role: string;
  full_name?: string;
  assigned_qa_id?: string;
};

type ProjectItem = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

type AssignmentItem = {
  id: string;
  developer_id: string;
  qa_id: string;
  project_id: string;
  dev_username?: string;
  qa_username?: string;
  project_name?: string;
};

export default function AdminPanel() {
  const [subTab, setSubTab] = useState<'users' | 'projects' | 'assignments'>('users');
  const [qas, setQas] = useState<QAProfile[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editingUser, setEditingUser] = useState<ProfileItem | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'dev',
    assignedQaId: ''
  });

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: ''
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    developerId: '',
    qaId: '',
    projectId: ''
  });

  const fetchData = async () => {
    // 1. Fetch QAs
    const { data: qasData } = await supabase
      .from('nocode_profiles')
      .select('id, username')
      .eq('role', 'QA');
    if (qasData) setQas(qasData);

    // 2. Fetch All Profiles
    const { data: profilesData } = await supabase
      .from('nocode_profiles')
      .select('*')
      .order('username', { ascending: true });
    if (profilesData) setProfiles(profilesData);

    // 3. Fetch All Projects
    const { data: projectsData } = await supabase
      .from('nocode_projects')
      .select('*')
      .order('name', { ascending: true });
    if (projectsData) setProjects(projectsData);

    // 4. Fetch All Assignments
    const { data: assignmentsData } = await supabase
      .from('nocode_project_assignments')
      .select(`
        id,
        developer_id,
        qa_id,
        project_id,
        developer:nocode_profiles!nocode_project_assignments_developer_id_fkey(username),
        qa:nocode_profiles!nocode_project_assignments_qa_id_fkey(username),
        project:nocode_projects!nocode_project_assignments_project_id_fkey(name)
      `);
    
    if (assignmentsData) {
      const formatted = (assignmentsData as any[]).map(item => ({
        id: item.id,
        developer_id: item.developer_id,
        qa_id: item.qa_id,
        project_id: item.project_id,
        dev_username: item.developer?.username || 'Unknown',
        qa_username: item.qa?.username || 'Unknown',
        project_name: item.project?.name || 'Unknown'
      }));
      setAssignments(formatted);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProjectFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssignmentFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditUserClick = (user: ProfileItem) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      fullName: user.full_name || '',
      password: '',
      role: user.role,
      assignedQaId: user.assigned_qa_id || ''
    });
    setMessage(null);
  };

  const handleCancelUserEdit = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      fullName: '',
      password: '',
      role: 'dev',
      assignedQaId: ''
    });
    setMessage(null);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append('username', userFormData.username);
      form.append('fullName', userFormData.fullName);
      form.append('password', userFormData.password);
      form.append('role', userFormData.role);
      
      if (userFormData.role === 'dev' && userFormData.assignedQaId) {
        form.append('assignedQaId', userFormData.assignedQaId);
      }

      if (editingUser) {
        form.append('userId', editingUser.id);
        const result = await updateUser(form);
        if (result.success) {
          setMessage({ type: 'success', text: result.message! });
          setEditingUser(null);
          setUserFormData({ username: '', fullName: '', password: '', role: 'dev', assignedQaId: '' });
          await fetchData();
        } else {
          setMessage({ type: 'error', text: result.error! });
        }
      } else {
        const result = await createNewUser(form);
        if (result.success) {
          setMessage({ type: 'success', text: result.message! });
          setUserFormData({ username: '', fullName: '', password: '', role: 'dev', assignedQaId: '' });
          await fetchData();
        } else {
          setMessage({ type: 'error', text: result.error! });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append('name', projectFormData.name);
      form.append('description', projectFormData.description);

      const result = await createProject(form);
      if (result.success) {
        setMessage({ type: 'success', text: result.message! });
        setProjectFormData({ name: '', description: '' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: result.error! });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append('developerId', assignmentFormData.developerId);
      form.append('qaId', assignmentFormData.qaId);
      form.append('projectId', assignmentFormData.projectId);

      const result = await createAssignment(form);
      if (result.success) {
        setMessage({ type: 'success', text: result.message! });
        setAssignmentFormData({ developerId: '', qaId: '', projectId: '' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: result.error! });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProj = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Se perderán las asignaciones relacionadas.')) return;
    setLoading(true);
    const result = await deleteProject(id);
    if (result.success) {
      setMessage({ type: 'success', text: result.message! });
      await fetchData();
    } else {
      setMessage({ type: 'error', text: result.error! });
    }
    setLoading(false);
  };

  const handleDeleteAssign = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;
    setLoading(true);
    const result = await deleteAssignment(id);
    if (result.success) {
      setMessage({ type: 'success', text: result.message! });
      await fetchData();
    } else {
      setMessage({ type: 'error', text: result.error! });
    }
    setLoading(false);
  };

  // Filter lists based on search
  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter(pr => 
    pr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pr.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignments = assignments.filter(a => 
    a.dev_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.qa_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const devs = profiles.filter(p => p.role === 'dev' || p.role === 'Developer');

  return (
    <div className="admin-panel glass">
      <div className="panel-header">
        <h2>Panel de Administración</h2>
        <p>Configura usuarios, crea proyectos y gestiona relaciones de equipos</p>
        
        {/* Navigation tabs */}
        <div className="subtabs-bar">
          <button 
            className={`subtab-btn ${subTab === 'users' ? 'active' : ''}`}
            onClick={() => { setSubTab('users'); setMessage(null); setSearchTerm(''); }}
          >
            Usuarios
          </button>
          <button 
            className={`subtab-btn ${subTab === 'projects' ? 'active' : ''}`}
            onClick={() => { setSubTab('projects'); setMessage(null); setSearchTerm(''); }}
          >
            Proyectos
          </button>
          <button 
            className={`subtab-btn ${subTab === 'assignments' ? 'active' : ''}`}
            onClick={() => { setSubTab('assignments'); setMessage(null); setSearchTerm(''); }}
          >
            Asignaciones QA y Proyectos
          </button>
        </div>
      </div>

      <div className="admin-content">
        
        {/* ==================== TAB 1: USERS ==================== */}
        {subTab === 'users' && (
          <>
            {/* Left Column: User Form */}
            <div className="form-card animate-fade-in">
              <h3>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
              
              {message && (
                <div className={`message-alert ${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="admin-form">
                <div className="form-group">
                  <label htmlFor="username">Nombre de Usuario</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="ej. juan.perez"
                    value={userFormData.username}
                    onChange={handleUserChange}
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fullName">Nombre Completo</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="ej. Juan Pérez"
                    value={userFormData.fullName}
                    onChange={handleUserChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Provisional'}
                  </label>
                  <input
                    type="text"
                    id="password"
                    name="password"
                    placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                    value={userFormData.password}
                    onChange={handleUserChange}
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Rol en el Sistema</label>
                  <select name="role" id="role" value={userFormData.role} onChange={handleUserChange} required>
                    <option value="dev">Desarrollador (dev)</option>
                    <option value="QA">Analista QA (QA)</option>
                    <option value="leader">Líder / Supervisor (leader)</option>
                    <option value="admin">Administrador (admin)</option>
                  </select>
                </div>

                {userFormData.role === 'dev' && (
                  <div className="form-group animate-fade-in">
                    <label htmlFor="assignedQaId">QA Principal / Fallback (Opcional)</label>
                    <select 
                      name="assignedQaId" 
                      id="assignedQaId" 
                      value={userFormData.assignedQaId} 
                      onChange={handleUserChange}
                    >
                      <option value="">-- Sin asignar --</option>
                      {qas.map(qa => (
                        <option key={qa.id} value={qa.id}>{qa.username}</option>
                      ))}
                    </select>
                    <small className="help-text">Establece el QA por defecto. Para asignar múltiples QAs en proyectos específicos, usa la pestaña de "Asignaciones".</small>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Procesando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                  </button>
                  {editingUser && (
                    <button type="button" className="btn-secondary" onClick={handleCancelUserEdit}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column: User List */}
            <div className="list-card animate-fade-in">
              <div className="card-header-row">
                <h3>Usuarios Registrados ({profiles.length})</h3>
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Rol</th>
                      <th>QA Principal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((user) => {
                      const assignedQa = qas.find(q => q.id === user.assigned_qa_id);
                      return (
                        <tr key={user.id} className={editingUser?.id === user.id ? 'row-editing' : ''}>
                          <td>
                            <span className="username-cell">{user.username}</span>
                          </td>
                          <td>{user.full_name || <em className="text-muted">Sin nombre</em>}</td>
                          <td>
                            <span className={`role-badge badge-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.role === 'dev' 
                              ? (assignedQa ? assignedQa.username : <span className="unassigned">Sin asignar</span>)
                              : <span className="not-applicable">-</span>
                            }
                          </td>
                          <td>
                            <button
                              className="btn-icon-edit"
                              onClick={() => handleEditUserClick(user)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 2: PROJECTS ==================== */}
        {subTab === 'projects' && (
          <>
            {/* Left Column: Project Form */}
            <div className="form-card animate-fade-in">
              <h3>Crear Nuevo Proyecto</h3>
              
              {message && (
                <div className={`message-alert ${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleProjectSubmit} className="admin-form">
                <div className="form-group">
                  <label htmlFor="name">Nombre del Proyecto</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="ej. Portal Cliente Bubble"
                    value={projectFormData.name}
                    onChange={handleProjectChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Escribe una breve descripción del proyecto..."
                    value={projectFormData.description}
                    onChange={handleProjectChange}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </form>
            </div>

            {/* Right Column: Project List */}
            <div className="list-card animate-fade-in">
              <div className="card-header-row">
                <h3>Proyectos en Sistema ({projects.length})</h3>
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Descripción</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td><strong>{project.name}</strong></td>
                        <td className="desc-cell">{project.description || <em className="text-muted">Sin descripción</em>}</td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-icon-delete"
                            onClick={() => handleDeleteProj(project.id)}
                            disabled={loading}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-table">No hay proyectos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 3: ASSIGNMENTS ==================== */}
        {subTab === 'assignments' && (
          <>
            {/* Left Column: Assignment Form */}
            <div className="form-card animate-fade-in">
              <h3>Asignar Dev a Proyecto y QA</h3>
              <p className="section-desc">Vincula desarrolladores con analistas QA en proyectos específicos. Esto permite soporte multi-QA y multi-proyecto.</p>
              
              {message && (
                <div className={`message-alert ${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAssignmentSubmit} className="admin-form">
                <div className="form-group">
                  <label htmlFor="developerId">Desarrollador (Dev)</label>
                  <select 
                    name="developerId" 
                    id="developerId" 
                    value={assignmentFormData.developerId} 
                    onChange={handleAssignmentChange}
                    required
                  >
                    <option value="">-- Selecciona desarrollador --</option>
                    {devs.map(d => (
                      <option key={d.id} value={d.id}>{d.username} ({d.full_name || 'Sin nombre'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="qaId">Analista QA</label>
                  <select 
                    name="qaId" 
                    id="qaId" 
                    value={assignmentFormData.qaId} 
                    onChange={handleAssignmentChange}
                    required
                  >
                    <option value="">-- Selecciona analista QA --</option>
                    {qas.map(qa => (
                      <option key={qa.id} value={qa.id}>{qa.username}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="projectId">Proyecto</label>
                  <select 
                    name="projectId" 
                    id="projectId" 
                    value={assignmentFormData.projectId} 
                    onChange={handleAssignmentChange}
                    required
                  >
                    <option value="">-- Selecciona proyecto --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Asignando...' : 'Crear Asignación'}
                </button>
              </form>
            </div>

            {/* Right Column: Assignments List */}
            <div className="list-card animate-fade-in">
              <div className="card-header-row">
                <h3>Asignaciones Activas ({assignments.length})</h3>
                <input
                  type="text"
                  placeholder="Buscar asignación..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Desarrollador (Dev)</th>
                      <th>Analista QA</th>
                      <th>Proyecto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assign) => (
                      <tr key={assign.id}>
                        <td><strong>{assign.dev_username}</strong></td>
                        <td>{assign.qa_username}</td>
                        <td><span className="project-tag">{assign.project_name}</span></td>
                        <td>
                          <button
                            className="btn-icon-delete"
                            onClick={() => handleDeleteAssign(assign.id)}
                            disabled={loading}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAssignments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-table">No hay asignaciones de equipo activas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      <style jsx>{`
        .admin-panel {
          padding: 32px;
          border-radius: var(--radius-lg);
          animation: fadeIn 0.4s ease-out forwards;
        }

        .panel-header {
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .panel-header h2 {
          font-family: var(--font-display);
          font-size: 1.7rem;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .panel-header p {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .subtabs-bar {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 4px;
        }

        .subtab-btn {
          padding: 10px 18px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: color 0.2s ease, border-color 0.2s ease;
          border-bottom: 2px solid transparent;
          border-radius: var(--radius-xs) var(--radius-xs) 0 0;
        }

        .subtab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
        }

        [data-theme="light"] .subtab-btn:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .subtab-btn.active {
          color: var(--color-primary);
          border-bottom: 2px solid transparent;
          border-image: linear-gradient(90deg, var(--color-primary), var(--color-secondary)) 1;
        }

        .admin-content {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .form-card, .list-card {
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.05), hsla(190, 90%, 50%, 0.03)),
            rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 24px;
        }

        .form-card {
          flex: 1;
          min-width: 320px;
          max-width: 420px;
        }

        .list-card {
          flex: 2;
          min-width: 480px;
        }

        [data-theme="light"] .form-card, [data-theme="light"] .list-card {
          background: rgba(0, 0, 0, 0.01);
        }

        .form-card h3, .list-card h3 {
          margin-bottom: 16px;
          color: var(--text-primary);
          font-size: 1.2rem;
        }

        .section-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .card-header-row h3 {
          margin-bottom: 0;
        }

        .search-input {
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.85rem;
          width: 260px;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--border-focus);
        }

        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        input, select, textarea {
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        .input-with-addon {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .input-with-addon:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        .input-with-addon input {
          border: none;
          background: transparent;
          flex: 1;
          box-shadow: none !important;
        }

        .addon {
          padding: 0 16px;
          color: var(--text-muted);
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.03);
          border-left: 1px solid var(--border-color);
          height: 100%;
          display: flex;
          align-items: center;
        }

        .help-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 4px;
          line-height: 1.3;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-primary {
          flex: 1;
          padding: 14px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px hsla(263, 85%, 64%, 0.25);
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-secondary {
          padding: 14px 20px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 1rem;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }

        .users-table th, .users-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .users-table th {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          font-weight: 600;
        }

        .row-editing {
          background: rgba(var(--color-primary-rgb), 0.05);
        }

        .username-cell {
          font-weight: 600;
          color: var(--text-primary);
        }

        .email-hint {
          display: block;
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .project-tag {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .role-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-dev {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }

        .badge-QA {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
        }

        .badge-leader {
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
        }

        .badge-admin {
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
        }

        .unassigned {
          color: var(--color-danger);
          font-style: italic;
        }

        .not-applicable, .text-muted {
          color: var(--text-muted);
        }

        .desc-cell {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-icon-edit, .btn-icon-delete {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon-edit:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .btn-icon-delete:hover {
          background: var(--color-danger);
          color: white;
          border-color: var(--color-danger);
        }

        .empty-table {
          text-align: center;
          padding: 32px !important;
          color: var(--text-muted);
        }

        .message-alert {
          padding: 14px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .message-alert.success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .message-alert.error {
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
