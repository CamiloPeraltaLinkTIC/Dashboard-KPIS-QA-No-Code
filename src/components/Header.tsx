'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

interface DeveloperItem {
  id: string;
  name: string;
}

interface HeaderProps {
  currentTab: string;
  selectedDeveloper: string;
  setSelectedDeveloper: (developer: string) => void;
  developers: DeveloperItem[];
}

export default function Header({
  currentTab,
  selectedDeveloper,
  setSelectedDeveloper,
  developers
}: HeaderProps) {
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('La imagen no debe superar 2MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) {
        setAvatarError('No se pudo subir la imagen: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-busting: el mismo path se reutiliza (upsert), así que sin esto
      // el navegador podría seguir mostrando la foto anterior.
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('nocode_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        setAvatarError('No se pudo guardar la foto de perfil: ' + updateError.message);
        return;
      }

      await refreshProfile();
      setAvatarMenuOpen(false);
    } catch (err) {
      setAvatarError('Error inesperado: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setAvatarUploading(false);
    }
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Evaluación de Desarrolladores No-Code';
      case 'metrics':
        return 'Historial de Auditorías';
      case 'validator':
        return 'Calificar Desarrollador (Nueva Auditoría)';
      case 'developers':
        return 'Perfiles Técnicos Individuales';
      case 'admin':
        return 'Administración';
      default:
        return 'Evaluación NoCodeQA';
    }
  };

  const getSubtitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Control de desempeño, tasas de aprobación técnica y clasificación de bugs del equipo de desarrollo.';
      case 'metrics':
        return 'Registro completo y auditoría cronológica de tareas revisadas.';
      case 'validator':
        return 'Evalúa los lineamientos técnicos de un entregable y calcula la calificación del desarrollador.';
      case 'developers':
        return 'Análisis detallado de aptitudes y evolución técnica por programador.';
      case 'admin':
        return 'Configura usuarios, proyectos y asignaciones de equipo.';
      default:
        return 'Métricas de calidad y desempeño.';
    }
  };

  const getTabIcon = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        );
      case 'metrics':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" x2="18" y1="20" y2="10" />
            <line x1="12" x2="12" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="14" />
          </svg>
        );
      case 'validator':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 12 2 2 4-4" />
            <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
          </svg>
        );
      case 'developers':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  return (
    <header className="header-container glass animate-fade-in">
      <div className="header-titles">
        <span className="header-tab-icon">{getTabIcon()}</span>
        <div>
          {currentTab === 'overview' && (
            <p className="header-welcome">Bienvenido, {profile?.full_name || profile?.username || 'Usuario'}</p>
          )}
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Developer Filter */}
        <div className="filter-wrapper">
          <svg className="filter-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <select
            id="dev-select"
            value={selectedDeveloper}
            onChange={(e) => setSelectedDeveloper(e.target.value)}
            className="dev-select"
          >
            <option value="All">Todos los desarrolladores</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.name}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Cambiar Tema" aria-label="Cambiar Tema">
          {theme === 'dark' ? (
            <svg key="sun" className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg key="moon" className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        {/* Profile Card */}
        <div className="user-profile">
          <div className="avatar-wrapper">
            <button
              type="button"
              className="profile-avatar"
              onClick={() => setAvatarMenuOpen((v) => !v)}
              title="Cambiar foto de perfil"
              aria-label="Cambiar foto de perfil"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="profile-avatar-img" />
              ) : (
                profile?.role?.substring(0, 2).toUpperCase() || 'QA'
              )}
              <span className="profile-status-dot" />
            </button>

            {avatarMenuOpen && (
              <div className="avatar-menu">
                <div className="avatar-menu-preview">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="avatar-menu-img" />
                  ) : (
                    <span className="avatar-menu-placeholder">{profile?.role?.substring(0, 2).toUpperCase() || 'QA'}</span>
                  )}
                </div>
                <label className="avatar-upload-label">
                  {avatarUploading ? 'Subiendo...' : 'Subir nueva foto'}
                  <input type="file" accept="image/*" onChange={handleAvatarFileChange} disabled={avatarUploading} hidden />
                </label>
                {avatarError && <p className="avatar-error">{avatarError}</p>}
                <button type="button" className="avatar-menu-close" onClick={() => setAvatarMenuOpen(false)}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
          <div className="profile-info">
            <span className="user-name">{profile?.full_name || profile?.username || 'Usuario'}</span>
            <span className="user-role">{profile?.role === 'leader' ? 'Líder' : (profile?.role === 'admin' || profile?.role === 'Administrator') ? 'Admin' : (profile?.role === 'dev' || profile?.role === 'Developer') ? 'Desarrollador' : 'QA'}</span>
          </div>
          <button className="icon-btn logout-btn" onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          z-index: 90;
        }

        .header-titles {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-tab-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: var(--shadow-glow);
        }

        .header-welcome {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: 2px;
        }

        .header-titles h1 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .header-titles p {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0 12px 0 10px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        [data-theme="light"] .filter-wrapper {
          background: rgba(0, 0, 0, 0.03);
        }

        .filter-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        .filter-icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .dev-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 9px 0;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        [data-theme="light"] .icon-btn {
          background: rgba(0, 0, 0, 0.02);
        }

        .icon-btn:hover {
          color: var(--color-primary);
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }

        .icon-btn:active {
          transform: translateY(0);
        }

        .theme-icon {
          animation: themeIconIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes themeIconIn {
          from { opacity: 0; transform: rotate(-45deg) scale(0.6); }
          to { opacity: 1; transform: rotate(0deg) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .theme-icon {
            animation: none;
          }
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-left: 16px;
          border-left: 1px solid var(--border-color);
        }

        .avatar-wrapper {
          position: relative;
        }

        .profile-avatar {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 0.85rem;
          box-shadow: var(--shadow-glow);
          border: none;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-menu {
          position: absolute;
          top: 46px;
          right: 0;
          width: 220px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          padding: 16px;
          z-index: 120;
          background: var(--bg-elevated);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          animation: dropdownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .avatar-menu-preview {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          box-shadow: var(--shadow-glow);
        }

        .avatar-menu-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-menu-placeholder {
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .avatar-upload-label {
          width: 100%;
          text-align: center;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.2s ease;
        }

        .avatar-upload-label:hover {
          filter: brightness(1.1);
        }

        .avatar-error {
          font-size: 0.7rem;
          color: var(--color-danger);
          text-align: center;
          line-height: 1.4;
        }

        .avatar-menu-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.72rem;
          cursor: pointer;
          font-weight: 600;
        }

        .avatar-menu-close:hover {
          color: var(--text-primary);
        }

        .profile-status-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-success);
          border: 2px solid var(--bg-card);
          box-shadow: 0 0 6px var(--color-success);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .logout-btn {
          margin-left: 8px;
          width: 32px;
          height: 32px;
          border: none;
          color: var(--color-danger);
          background: rgba(244, 63, 94, 0.1);
        }

        .logout-btn:hover {
          background: rgba(244, 63, 94, 0.2);
          color: var(--color-danger);
        }
      `}</style>
    </header>
  );
}
