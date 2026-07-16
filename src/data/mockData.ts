export interface DeveloperReview {
  id: string;
  taskName: string;
  platform: 'Bubble' | 'FlutterFlow' | 'Make' | 'Zapier' | 'Retool';
  date: string;
  score: number;
  status: 'approved' | 'rejected' | 'in_review';
  kpis: {
    pixelPerfect: number;
    cumplimientoDod: number;
    calidadVisual: number;
    erroresVisuales: number;
    retrabajo: number;
  };
  details: string;
  qaAnalyst: string;
}

export interface DeveloperStat {
  id: string;
  name: string;
  role: string;
  avatar: string;
  approvedFirstTry: number;
  totalTasks: number;
  avgFixTimeHours: number;
  complianceRate: number; // average score of all reviews
  skillsScore: {
    structure: number; // Estructura & Nomenclatura (0-100)
    performance: number; // Rendimiento & Optimización (0-100)
    security: number; // Manejo de Errores & Seguridad (0-100)
    ux: number; // Responsividad & UX (0-100)
  };
  kpisTotal: {
    pixelPerfect: number;
    cumplimientoDod: number;
    calidadVisual: number;
    erroresVisuales: number;
    retrabajo: number;
  };
  reviews: DeveloperReview[];
}

export interface WeeklyTrend {
  week: string;
  avgScore: number;
  totalBugs: number;
  tasksAudited: number;
}

export interface RuleCategory {
  category: string;
  rules: {
    id: string;
    text: string;
    weight: 'high' | 'medium' | 'low';
    passed: boolean;
  }[];
}

// Initial Mock Developers Data
export const mockDevelopers: DeveloperStat[] = [
  {
    id: 'dev-1',
    name: 'Carlos Mendoza',
    role: 'No-Code Developer (Bubble)',
    avatar: 'CM',
    approvedFirstTry: 12,
    totalTasks: 15,
    avgFixTimeHours: 4.5,
    complianceRate: 92,
    skillsScore: { structure: 90, performance: 88, security: 95, ux: 94 },
    kpisTotal: { pixelPerfect: 95, cumplimientoDod: 92, calidadVisual: 94, erroresVisuales: 2, retrabajo: 1 },
    reviews: [
      {
        id: 'QA-2026-042',
        taskName: 'Dashboard de Clientes V2',
        platform: 'Bubble',
        date: '2026-07-14',
        score: 95,
        status: 'approved',
        kpis: { pixelPerfect: 96, cumplimientoDod: 95, calidadVisual: 98, erroresVisuales: 1, retrabajo: 0 },
        details: 'Excelente optimización de base de datos. Solo se encontró un desalineamiento visual menor en el panel lateral.',
        qaAnalyst: 'Ana Romero'
      },
      {
        id: 'QA-2026-037',
        taskName: 'Landing Page Campaña Julio',
        platform: 'Bubble',
        date: '2026-07-08',
        score: 92,
        status: 'approved',
        kpis: { pixelPerfect: 90, cumplimientoDod: 100, calidadVisual: 90, erroresVisuales: 1, retrabajo: 0 },
        details: 'Los estilos responsivos se ajustaron para dispositivos móviles menores a 375px.',
        qaAnalyst: 'Marcos Díaz'
      },
      {
        id: 'QA-2026-031',
        taskName: 'Formulario de Onboarding',
        platform: 'Bubble',
        date: '2026-06-28',
        score: 88,
        status: 'approved',
        kpis: { pixelPerfect: 85, cumplimientoDod: 80, calidadVisual: 88, erroresVisuales: 0, retrabajo: 1 },
        details: 'Flujo de registro validado. Requiere mejor ordenación en carpetas de workflows.',
        qaAnalyst: 'Ana Romero'
      }
    ]
  },
  {
    id: 'dev-2',
    name: 'Sofía Castro',
    role: 'Integration Engineer (Make/Retool)',
    avatar: 'SC',
    approvedFirstTry: 18,
    totalTasks: 20,
    avgFixTimeHours: 3.2,
    complianceRate: 96,
    skillsScore: { structure: 97, performance: 95, security: 98, ux: 90 },
    kpisTotal: { pixelPerfect: 90, cumplimientoDod: 98, calidadVisual: 92, erroresVisuales: 1, retrabajo: 0 },
    reviews: [
      {
        id: 'QA-2026-041',
        taskName: 'Sincronizador de Leads Hubspot',
        platform: 'Make',
        date: '2026-07-13',
        score: 100,
        status: 'approved',
        kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 0 },
        details: 'Flujo Make limpio, manejo de errores robusto con filtros de reintento implementados correctamente.',
        qaAnalyst: 'Marcos Díaz'
      },
      {
        id: 'QA-2026-038',
        taskName: 'Portal de Soporte Interno',
        platform: 'Retool',
        date: '2026-07-09',
        score: 82,
        status: 'in_review',
        kpis: { pixelPerfect: 80, cumplimientoDod: 85, calidadVisual: 82, erroresVisuales: 1, retrabajo: 0 },
        details: 'Pendiente confirmar si las consultas SQL pesadas pueden ser paginadas para mejorar performance.',
        qaAnalyst: 'Ana Romero'
      },
      {
        id: 'QA-2026-033',
        taskName: 'Webhook Conciliación Bancaria',
        platform: 'Make',
        date: '2026-07-02',
        score: 98,
        status: 'approved',
        kpis: { pixelPerfect: 95, cumplimientoDod: 100, calidadVisual: 98, erroresVisuales: 0, retrabajo: 0 },
        details: 'Lógica impecable, manejo de tokens seguro.',
        qaAnalyst: 'Marcos Díaz'
      }
    ]
  },
  {
    id: 'dev-3',
    name: 'Diego Ortega',
    role: 'Mobile Developer (FlutterFlow)',
    avatar: 'DO',
    approvedFirstTry: 7,
    totalTasks: 12,
    avgFixTimeHours: 11.5,
    complianceRate: 78,
    skillsScore: { structure: 82, performance: 75, security: 80, ux: 76 },
    kpisTotal: { pixelPerfect: 65, cumplimientoDod: 70, calidadVisual: 60, erroresVisuales: 10, retrabajo: 5 },
    reviews: [
      {
        id: 'QA-2026-040',
        taskName: 'App de Repartidores MVP',
        platform: 'FlutterFlow',
        date: '2026-07-12',
        score: 68,
        status: 'rejected',
        kpis: { pixelPerfect: 60, cumplimientoDod: 65, calidadVisual: 55, erroresVisuales: 5, retrabajo: 2 },
        details: 'Se observaron múltiples fallas lógicas en el guardado de estado local (SQLite) y tiempos de carga excesivos por llamadas API no optimizadas.',
        qaAnalyst: 'Ana Romero'
      },
      {
        id: 'QA-2026-034',
        taskName: 'Módulo de Geolocalización FF',
        platform: 'FlutterFlow',
        date: '2026-07-04',
        score: 85,
        status: 'approved',
        kpis: { pixelPerfect: 80, cumplimientoDod: 90, calidadVisual: 85, erroresVisuales: 2, retrabajo: 1 },
        details: 'Se aprobaron los mapas tras corregir el callback de permisos.',
        qaAnalyst: 'Ana Romero'
      },
      {
        id: 'QA-2026-030',
        taskName: 'UI Perfil de Repartidor',
        platform: 'FlutterFlow',
        date: '2026-06-25',
        score: 72,
        status: 'rejected',
        kpis: { pixelPerfect: 55, cumplimientoDod: 60, calidadVisual: 50, erroresVisuales: 3, retrabajo: 2 },
        details: 'El layout se rompe en pantallas menores de 390px de ancho.',
        qaAnalyst: 'Marcos Díaz'
      }
    ]
  },
  {
    id: 'dev-4',
    name: 'Esteban Ruiz',
    role: 'Automation Specialist (Zapier)',
    avatar: 'ER',
    approvedFirstTry: 14,
    totalTasks: 16,
    avgFixTimeHours: 2.8,
    complianceRate: 89,
    skillsScore: { structure: 91, performance: 89, security: 90, ux: 84 },
    kpisTotal: { pixelPerfect: 88, cumplimientoDod: 90, calidadVisual: 85, erroresVisuales: 1, retrabajo: 1 },
    reviews: [
      {
        id: 'QA-2026-039',
        taskName: 'Automatización de Facturación',
        platform: 'Zapier',
        date: '2026-07-10',
        score: 90,
        status: 'approved',
        kpis: { pixelPerfect: 90, cumplimientoDod: 95, calidadVisual: 90, erroresVisuales: 0, retrabajo: 1 },
        details: 'Zap validado. Se corrigió una llave de mapeo de impuestos incorrecta durante la revisión interactiva.',
        qaAnalyst: 'Marcos Díaz'
      },
      {
        id: 'QA-2026-032',
        taskName: 'Notificador Slack de Alertas',
        platform: 'Zapier',
        date: '2026-06-30',
        score: 88,
        status: 'approved',
        kpis: { pixelPerfect: 85, cumplimientoDod: 85, calidadVisual: 80, erroresVisuales: 1, retrabajo: 0 },
        details: 'Funciona según lo esperado. Algún detalle menor en el formateo del bloque de texto.',
        qaAnalyst: 'Ana Romero'
      }
    ]
  }
];

export const mockWeeklyTrends: WeeklyTrend[] = [
  { week: 'Semana 24', avgScore: 82, totalBugs: 24, tasksAudited: 8 },
  { week: 'Semana 25', avgScore: 84, totalBugs: 25, tasksAudited: 9 },
  { week: 'Semana 26', avgScore: 85, totalBugs: 23, tasksAudited: 11 },
  { week: 'Semana 27', avgScore: 88, totalBugs: 15, tasksAudited: 7 },
  { week: 'Semana 28', avgScore: 91, totalBugs: 9, tasksAudited: 6 },
  { week: 'Semana 29', avgScore: 92, totalBugs: 9, tasksAudited: 6 },
];

export const defaultRuleCategories: RuleCategory[] = [
  {
    category: 'Estructura & Nomenclatura',
    rules: [
      { id: 'str-1', text: 'Nombres descriptivos en contenedores, variables y workflows (Prefijos estándar como btn_, section_, var_).', weight: 'medium', passed: true },
      { id: 'str-2', text: 'Eliminar elementos de prueba sueltos, cajas vacías y workflows sin uso.', weight: 'high', passed: false },
      { id: 'str-3', text: 'Uso correcto de carpetas o etiquetas para agrupar automatizaciones / páginas.', weight: 'low', passed: true }
    ]
  },
  {
    category: 'Rendimiento & Optimización',
    rules: [
      { id: 'perf-1', text: 'Búsquedas y filtros del lado del servidor en lugar de cargar toda la data en cliente.', weight: 'high', passed: true },
      { id: 'perf-2', text: 'Evitar loops infinitos de APIs o workflows recurrentes no controlados.', weight: 'high', passed: true },
      { id: 'perf-3', text: 'Compresión y WebP en imágenes/recursos pesados cargados en el editor.', weight: 'medium', passed: false }
    ]
  },
  {
    category: 'Manejo de Errores & Seguridad',
    rules: [
      { id: 'sec-1', text: 'Configurar control de flujo de error en APIs críticas (pasos condicionales si falla un nodo).', weight: 'high', passed: false },
      { id: 'sec-2', text: 'Reglas de Privacidad activadas en base de datos (Privacy Rules en Bubble, Row-Level en SQL).', weight: 'high', passed: true },
      { id: 'sec-3', text: 'Llaves de API y credenciales almacenadas de manera segura (Environment Variables), nunca quemadas en texto plano.', weight: 'high', passed: true }
    ]
  },
  {
    category: 'Responsividad & UX',
    rules: [
      { id: 'ux-1', text: 'Layouts con Flexbox/CSS Grid nativo de la herramienta que se adapten a móvil, tableta y desktop.', weight: 'high', passed: true },
      { id: 'ux-2', text: 'Estados de carga (loaders, esqueletos) visibles en botones y llamadas asíncronas.', weight: 'medium', passed: true },
      { id: 'ux-3', text: 'Mensajes de error y éxito amigables y accesibles para el usuario.', weight: 'medium', passed: true }
    ]
  }
];
