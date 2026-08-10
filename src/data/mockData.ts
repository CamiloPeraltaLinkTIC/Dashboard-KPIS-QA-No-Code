export interface LinkedReview {
  id: string;
  reviewCode?: string;
  score: number;
  date: string;
}

export interface DeveloperReview {
  id: string;
  reviewCode?: string; // Código legible REV-<año>-<secuencial>, generado en la BD
  parentReviewId?: string; // Si existe, esta revisión es un reintento de otra (reabrir historial)
  // Una revisión "de en medio" de una cadena puede ser ambas cosas a la vez
  // (reintento de una anterior Y tener su propio reintento después), por eso
  // son dos campos independientes y no uno solo con un "role".
  retestOf?: LinkedReview; // La revisión original de la que esta es reintento
  retestedBy?: LinkedReview; // El reintento más reciente que reabrió esta revisión
  projectId?: string;
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
  avatarUrl?: string;
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
