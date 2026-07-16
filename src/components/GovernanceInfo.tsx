'use client';

import React, { useState } from 'react';

interface GuideItem {
  id: string;
  title: string;
  platform: 'General' | 'Bubble' | 'FlutterFlow' | 'Make/Zapier' | 'Retool';
  severity: 'Crítica' | 'Recomendada' | 'Opcional';
  description: string;
  solution: string;
}

export default function GovernanceInfo() {
  const [activePlatform, setActivePlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const guides: GuideItem[] = [
    {
      id: 'GOV-BUB-01',
      title: 'Uso de Privacy Rules en Tablas de Base de Datos',
      platform: 'Bubble',
      severity: 'Crítica',
      description: 'Cualquier tabla creada en Bubble (Data Types) que contenga información personal (PII), transacciones o configuraciones del cliente debe tener habilitadas "Privacy Rules" en la pestaña Data > Privacy.',
      solution: 'Define una regla como "This User is Creator" o "Current User is Logged In" y desmarca los campos sensibles en la casilla "Find in searches" o "View fields" para todos los demás roles.'
    },
    {
      id: 'GOV-BUB-02',
      title: 'Constraints en Búsquedas del Servidor (Search Constraints)',
      platform: 'Bubble',
      severity: 'Crítica',
      description: 'Hacer búsquedas sin filtros (constraints) y luego filtrarlas en el cliente usando ":filtered" descarga toda la base de datos en el navegador del usuario. Esto degrada críticamente la velocidad de carga y expone datos.',
      solution: 'Mueve todos los filtros al cuadro de diálogo principal de "Do a search for". Utiliza ":filtered" únicamente para filtros complejos que no puedan realizarse del lado del servidor.'
    },
    {
      id: 'GOV-FF-01',
      title: 'Nomenclatura Estándar de Widgets e Hilos de Estado',
      platform: 'FlutterFlow',
      severity: 'Recomendada',
      description: 'El uso de nombres por defecto (como Container34, ListView_2) dificulta las pruebas QA y el mantenimiento del código. QA no puede asociar selectores automatizados con el DOM.',
      solution: 'Renombra los componentes interactivos y contenedores principales usando prefijos lógicos: btn_submit, input_email, list_products, card_details.'
    },
    {
      id: 'GOV-FF-02',
      title: 'Control de Caché en Consultas de Base de Datos y APIs',
      platform: 'FlutterFlow',
      severity: 'Recomendada',
      description: 'Realizar peticiones de red directas en componentes que se repiten (como items de listas) sin almacenar en caché genera miles de lecturas innecesarias en Firebase/APIs, inflando los costos.',
      solution: 'Habilita "Cache Query" en las consultas de backend e implementa llamadas a nivel de página distribuyendo la data a los hijos mediante parámetros.'
    },
    {
      id: 'GOV-INT-01',
      title: 'Directiva de Manejo de Errores (Error Handler Paths)',
      platform: 'Make/Zapier',
      severity: 'Crítica',
      description: 'Los escenarios de Make o Zaps sin manejo de errores se detienen inmediatamente al fallar un paso, dejando transacciones a la mitad e interrumpiendo integraciones críticas de marketing.',
      solution: 'En Make, añade un módulo de control de error a la derecha del nodo propenso a fallas. Utiliza directivas como "Resume" (con valor por defecto), "Ignore" o "Commit". En Zapier, configura el paso de contingencia si falla el anterior.'
    },
    {
      id: 'GOV-INT-02',
      title: 'Almacenamiento Seguro de Credenciales (Environment Variables)',
      platform: 'Make/Zapier',
      severity: 'Crítica',
      description: 'Quemarse (hardcodear) API Keys, contraseñas o tokens en texto plano dentro de campos de texto o módulos personalizados representa una brecha de seguridad grave.',
      solution: 'Almacena llaves en las variables de entorno de la plataforma o utiliza el gestor de conexiones cifradas integrado para autenticarte.'
    },
    {
      id: 'GOV-RET-01',
      title: 'Paginación del Lado del Servidor en Consultas SQL',
      platform: 'Retool',
      severity: 'Recomendada',
      description: 'Cargar tablas de datos de más de 100 registros directamente mediante un SELECT * completo causa lag severo en el pintado de la UI del portal.',
      solution: 'Configura la paginación nativa del componente Table utilizando las variables {{ table1.pageSize }} y {{ table1.pageOffset }} en la consulta SQL limitante (LIMIT/OFFSET).'
    },
    {
      id: 'GOV-GEN-01',
      title: 'Compresión Obligatoria de Recursos de Imagen',
      platform: 'General',
      severity: 'Opcional',
      description: 'Subir imágenes PNG o JPEG sin optimizar (&gt; 1MB) para elementos decorativos arruina los Core Web Vitals en páginas de destino (Landing Pages) de mercadeo.',
      solution: 'Comprime todas las imágenes usando TinyPNG y conviértelas a formato WebP antes de subirlas al gestor multimedia de la plataforma no-code.'
    }
  ];

  const filteredGuides = guides.filter((item) => {
    const matchesPlatform = activePlatform === 'All' || item.platform === activePlatform;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Crítica':
        return <span className="badge badge-danger">Crítica</span>;
      case 'Recomendada':
        return <span className="badge badge-warning">Recomendada</span>;
      default:
        return <span className="badge badge-neutral">Opcional</span>;
    }
  };

  return (
    <div className="gov-layout">
      {/* Platform Tabs */}
      <div className="tabs-header glass">
        <div className="platform-tabs">
          {['All', 'General', 'Bubble', 'FlutterFlow', 'Make/Zapier', 'Retool'].map((plat) => (
            <button
              key={plat}
              onClick={() => setActivePlatform(plat)}
              className={`plat-tab-btn ${activePlatform === plat ? 'active' : ''}`}
            >
              {plat === 'All' ? 'Todos' : plat}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar directriz o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="guides-grid">
        {filteredGuides.length > 0 ? (
          filteredGuides.map((guide) => (
            <div key={guide.id} className="guide-card glass">
              <div className="guide-card-header">
                <span className="guide-id">{guide.id}</span>
                {getSeverityBadge(guide.severity)}
              </div>

              <div className="guide-title-group">
                <h3>{guide.title}</h3>
                <span className="guide-plat-tag">{guide.platform}</span>
              </div>

              <div className="guide-content-section">
                <h4>Problema / Por qué importa:</h4>
                <p>{guide.description}</p>
              </div>

              <div className="guide-solution-section">
                <h4>Solución / Criterio de QA:</h4>
                <p>{guide.solution}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results glass">
            <h3>No se encontraron directrices</h3>
            <p>Prueba ajustando los filtros de plataforma o tu término de búsqueda.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .gov-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-radius: var(--radius-sm);
          flex-wrap: wrap;
          gap: 12px;
        }

        .platform-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .plat-tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-xs);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .plat-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .plat-tab-btn:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .plat-tab-btn.active {
          color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          width: 260px;
        }

        [data-theme="light"] .search-bar {
          background: rgba(0, 0, 0, 0.01);
        }

        .search-bar input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          width: 100%;
        }

        .search-bar svg {
          color: var(--text-muted);
        }

        .guides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .guide-card {
          padding: 20px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .guide-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .guide-id {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .guide-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .guide-title-group h3 {
          font-size: 0.95rem;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .guide-plat-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-primary);
          background: var(--color-primary-glow);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
          text-transform: uppercase;
        }

        .guide-content-section, .guide-solution-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .guide-content-section h4, .guide-solution-section h4 {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .guide-content-section p, .guide-solution-section p {
          font-size: 0.78rem;
          line-height: 1.45;
          color: var(--text-secondary);
        }

        .guide-solution-section {
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
          margin-top: 4px;
        }

        .guide-solution-section p {
          color: var(--text-primary);
        }

        .no-results {
          grid-column: 1 / -1;
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }

        .no-results h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .no-results p {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
