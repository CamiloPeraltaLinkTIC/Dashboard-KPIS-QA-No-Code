export interface DeveloperReview {
  id: string;
  taskName: string;
  platform?: string; // (legado) ya no se captura en la UI; se conserva opcional por compatibilidad
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

export interface RuleCategory {
  category: string;
  rules: {
    id: string;
    text: string;
    weight: 'high' | 'medium' | 'low';
    passed: boolean;
  }[];
}

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
