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
