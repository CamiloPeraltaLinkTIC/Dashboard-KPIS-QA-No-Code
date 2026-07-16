'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = `${username.trim()}@yopmail.com`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <h2>Panel de Calidad y Gobernanza</h2>
          <p>Inicia sesión con tu usuario</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <div className="input-with-addon">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. fabian.peralta"
                required
                autoComplete="username"
              />
              <span className="addon">@yopmail.com</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-app);
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h2 {
          color: var(--text-primary);
          font-size: 1.6rem;
          margin-bottom: 8px;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .login-form {
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

        input {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        input:focus {
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

        .btn-primary {
          margin-top: 10px;
          padding: 14px;
          border-radius: var(--radius-sm);
          background: var(--color-primary);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
          font-size: 0.85rem;
          border: 1px solid rgba(244, 63, 94, 0.2);
          text-align: center;
        }

        .glass {
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
