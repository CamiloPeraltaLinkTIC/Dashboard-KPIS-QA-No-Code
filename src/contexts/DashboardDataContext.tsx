'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { deleteKpiReview } from '@/app/actions/admin';
import { DeveloperStat, DeveloperReview } from '@/data/mockData';

type ReopenContext = {
  parentReviewId: string;
  parentReviewCode?: string;
  taskName: string;
  devId: string;
  projectId?: string;
  parentRetrabajo: number;
};

type LogJumpTarget = { id: string; nonce: number };

type LogEntry = DeveloperReview & { developerName: string; developerId: string };

type DashboardDataContextType = {
  developers: DeveloperStat[];
  allProjects: { id: string; name: string }[];
  projectAssignments: { developer_id: string; project_id: string }[];
  selectedDeveloper: string;
  setSelectedDeveloper: (developer: string) => void;
  selectedDeveloperData: DeveloperStat | undefined;
  developersDropdown: { id: string; name: string }[];
  allReviews: LogEntry[];
  filteredReviews: LogEntry[];
  stats: {
    pixelPerfect: number;
    erroresVisuales: number;
    retrabajo: number;
    kpisTotal: DeveloperStat['kpisTotal'];
    trendPixel: number[];
    trendDod: number[];
    trendCalidad: number[];
    trendErrores: number[];
    trendRework: number[];
  };
  heroScore: number;
  heroBreakdown: { approved: number; inReview: number; rejected: number; total: number };
  handleAddReview: (devId: string, projectId: string, newReview: DeveloperReview, parentReviewId?: string) => Promise<void>;
  handleDeleteReview: (reviewId: string, developerId: string) => Promise<void>;
  handleReopenReview: (log: DeveloperReview & { developerId: string }) => void;
  reopenContext: ReopenContext | null;
  clearReopenContext: () => void;
  logJumpTarget: LogJumpTarget | null;
  handleSelectObservation: (reviewId: string) => void;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  activeProfileData: DeveloperStat | undefined;
  preselectedDevId: string | undefined;
};

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData debe usarse dentro de DashboardDataProvider');
  return ctx;
}

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [selectedDeveloper, setSelectedDeveloper] = useState('All');
  const [reopenContext, setReopenContext] = useState<ReopenContext | null>(null);
  const [logJumpTarget, setLogJumpTarget] = useState<LogJumpTarget | null>(null);

  // Desde "Observaciones Recientes": salta al Historial de abajo, con esa fila expandida.
  const handleSelectObservation = (reviewId: string) => {
    setLogJumpTarget({ id: reviewId, nonce: Date.now() });
  };

  const [developers, setDevelopers] = useState<DeveloperStat[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<{ developer_id: string; project_id: string }[]>([]);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchRealData = async () => {
      if (!profile) return;

      try {
        // 1. Fetch Developers
        let devQuery = supabase.from('nocode_profiles').select('*').in('role', ['dev', 'Developer', 'desarrollador']);

        const isDev = profile.role === 'dev' || profile.role === 'Developer';

        if (isDev) {
          // El dev solo se ve a sí mismo
          devQuery = devQuery.eq('id', profile.id);
        }
        // Para QA no aplicamos filtro extra: la RLS ya limita a los devs asignados
        // (nocode_profiles.assigned_qa_id = QA). Para leader/admin, la RLS permite ver todos.

        const { data: devsData, error: devsError } = await devQuery;
        if (devsError || !devsData) return;

        const { data: projectsData } = await supabase
          .from('nocode_projects')
          .select('id, name');
        setAllProjects(projectsData || []);

        const devIds = devsData.map(d => d.id);
        if (devIds.length === 0) {
          setDevelopers([]);
          setProjectAssignments([]);
          return;
        }

        // 1.5 Fetch project assignments (developer <-> proyecto) para acotar
        // el desplegable de "Proyecto" a los proyectos enlazados a cada dev.
        const { data: assignmentsData } = await supabase
          .from('nocode_project_assignments')
          .select('developer_id, project_id')
          .in('developer_id', devIds);
        setProjectAssignments(assignmentsData || []);

        // 2. Fetch KPIs for these developers
        const { data: kpisData } = await supabase
          .from('nocode_kpis')
          .select('*, qa:nocode_profiles!nocode_kpis_qa_analyst_id_fkey(username)')
          .in('developer_id', devIds);

        // 3. Transform to DeveloperStat
        const realDevelopers: DeveloperStat[] = devsData.map(devRow => {
          const devKpis = (kpisData || []).filter(k => k.developer_id === devRow.id);

          const reviews: DeveloperReview[] = devKpis.map(k => ({
            id: k.id,
            reviewCode: k.review_code || undefined,
            parentReviewId: k.parent_review_id || undefined,
            projectId: k.project_id || undefined,
            taskName: k.task_name,
            date: k.created_at, // timestamp completo (fecha y hora)
            score: k.score || 0,
            // La BD almacena 'review'; internamente la app usa 'in_review'
            status: (k.status === 'review' ? 'in_review' : k.status) as any,
            kpis: {
              pixelPerfect: k.pixel_perfect || 0,
              cumplimientoDod: k.cumplimiento_dod || 0,
              calidadVisual: k.calidad_visual || 0,
              erroresVisuales: k.errores_visuales || 0,
              retrabajo: k.retrabajo || 0,
            },
            details: k.details || 'Reporte de QA',
            qaAnalyst: (k.qa as any)?.username || 'QA'
          }));

          const totalTasks = reviews.length;
          // No cuenta como "primer intento" si viene de un reintento (reabrir historial).
          const approvedFirstTry = reviews.filter(r => r.status === 'approved' && !r.parentReviewId).length;
          const complianceRate = totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / totalTasks) : 100;

          const kpisTotal = {
            pixelPerfect: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.pixelPerfect, 0) / totalTasks) : 100,
            cumplimientoDod: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.cumplimientoDod, 0) / totalTasks) : 100,
            calidadVisual: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.calidadVisual, 0) / totalTasks) : 100,
            erroresVisuales: reviews.reduce((sum, r) => sum + r.kpis.erroresVisuales, 0),
            // El total no suma el valor de retrabajo de cada fila (que escala
            // con la profundidad de la cadena: 1, 2, 3...), sino que cuenta
            // cuántas veces se reabrió algo (cuántas filas tienen parentReviewId).
            retrabajo: reviews.filter((r) => !!r.parentReviewId).length,
          };

          // Competencias derivadas de los KPIs reales (antes eran valores fijos)
          const erroresPenalty = totalTasks > 0
            ? Math.min(70, Math.round((kpisTotal.erroresVisuales / totalTasks) * 12))
            : 0;
          const skillsScore = {
            structure: kpisTotal.cumplimientoDod,        // Cumplimiento de directrices / DoD
            performance: complianceRate,                 // Score global de calidad
            security: Math.max(0, 100 - erroresPenalty), // A menos errores, mejor manejo
            ux: kpisTotal.calidadVisual,                 // Calidad visual / responsividad
          };

          return {
            id: devRow.id,
            name: devRow.full_name || devRow.username || 'Desconocido',
            role: 'Desarrollador No-Code',
            avatar: (devRow.username || 'D').substring(0, 2).toUpperCase(),
            avatarUrl: devRow.avatar_url || undefined,
            approvedFirstTry,
            totalTasks,
            complianceRate,
            skillsScore,
            kpisTotal,
            reviews: reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
        });

        setDevelopers(realDevelopers);
        // El filtro (Header, stats, etc.) trabaja siempre con el NOMBRE del dev, no el id.
        // Uso actualización funcional para no leer un valor obsoleto durante el auto-refresco.
        if (isDev && realDevelopers.length > 0) {
          setSelectedDeveloper(realDevelopers[0].name);
        } else {
          setSelectedDeveloper((prev) =>
            prev !== 'All' && !realDevelopers.some((d) => d.name === prev) ? 'All' : prev
          );
        }
      } catch (e) {
        console.error('Error fetching real data:', e);
      }
    };

    fetchRealData();

    // Auto-actualización sin necesidad de cerrar sesión:
    // al volver a la pestaña (focus/visibilidad) y periódicamente cada 30s.
    const onFocus = () => fetchRealData();
    const onVisible = () => { if (document.visibilityState === 'visible') fetchRealData(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const intervalId = setInterval(fetchRealData, 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(intervalId);
    };
  }, [profile]);

  // Recalcula los agregados de un desarrollador a partir de su lista de reviews
  // (usado tras agregar o eliminar una calificación, para actualizar el estado
  // local sin esperar al próximo refresco automático).
  const computeDevAggregates = (reviews: DeveloperReview[]) => {
    const totalTasks = reviews.length;
    // No cuenta como "primer intento" si viene de un reintento (reabrir historial).
    const approvedFirstTry = reviews.filter((r) => r.status === 'approved' && !r.parentReviewId).length;
    const complianceRate = totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / totalTasks) : 100;

    const kpisTotal = {
      pixelPerfect: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.pixelPerfect, 0) / totalTasks) : 100,
      cumplimientoDod: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.cumplimientoDod, 0) / totalTasks) : 100,
      calidadVisual: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.calidadVisual, 0) / totalTasks) : 100,
      erroresVisuales: reviews.reduce((sum, r) => sum + r.kpis.erroresVisuales, 0),
      // Cuenta reaperturas, no la suma de valores de retrabajo (ver comentario en el fetch inicial).
      retrabajo: reviews.filter((r) => !!r.parentReviewId).length,
    };

    return { totalTasks, approvedFirstTry, complianceRate, kpisTotal };
  };

  const handleAddReview = async (devId: string, projectId: string, newReview: DeveloperReview, parentReviewId?: string) => {
    // Attempt to save to Supabase
    if (profile?.id) {
      try {
        const { data, error } = await supabase.from('nocode_kpis').insert([{
          developer_id: devId,
          qa_analyst_id: profile.id,
          project_id: projectId || null,
          task_name: newReview.taskName,
          // La columna 'platform' es NOT NULL en la BD; ya no se usa en la UI, se envía un valor por defecto
          platform: 'General',
          score: newReview.score,
          // La BD sólo admite 'review'; la app usa 'in_review' internamente
          status: newReview.status === 'in_review' ? 'review' : newReview.status,
          pixel_perfect: newReview.kpis.pixelPerfect,
          cumplimiento_dod: newReview.kpis.cumplimientoDod,
          calidad_visual: newReview.kpis.calidadVisual,
          errores_visuales: newReview.kpis.erroresVisuales,
          retrabajo: newReview.kpis.retrabajo,
          details: newReview.details,
          month: new Date().toISOString().substring(0, 7),
          parent_review_id: parentReviewId || null
        }]).select('id, created_at, review_code').single();

        if (error) {
          console.error('Error saving to Supabase:', error);
          alert('Error al guardar: ' + error.message);
          return;
        }

        // Update local state smoothly
        newReview.id = data.id;
        newReview.date = data.created_at; // timestamp completo (fecha y hora)
        newReview.reviewCode = data.review_code || undefined;
        newReview.parentReviewId = parentReviewId;

        setDevelopers((prevDevs) => {
          return prevDevs.map((dev) => {
            if (dev.id === devId) {
              const updatedReviews = [newReview, ...dev.reviews];
              return { ...dev, reviews: updatedReviews, ...computeDevAggregates(updatedReviews) };
            }
            return dev;
          });
        });
      } catch (e) {
        console.error('Error saving to Supabase:', e);
      }
    }
  };

  // Solo admin puede borrar del historial de auditorías (verificado también
  // en el servidor). Borra en Supabase y actualiza el estado local al toque.
  const handleDeleteReview = async (reviewId: string, developerId: string) => {
    if (!profile?.id) return;

    const { data: { session } } = await supabase.auth.getSession();
    const result = await deleteKpiReview(reviewId, session?.access_token || '');
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
      return;
    }

    setDevelopers((prevDevs) =>
      prevDevs.map((dev) => {
        if (dev.id !== developerId) return dev;
        const updatedReviews = dev.reviews.filter((r) => r.id !== reviewId);
        return { ...dev, reviews: updatedReviews, ...computeDevAggregates(updatedReviews) };
      })
    );
  };

  // Reabre una revisión: navega a "Calificar Desarrollador" pre-cargado y
  // vinculado a la revisión original vía parentReviewId (ambos puntajes
  // quedan visibles para trazabilidad, ninguno reemplaza al otro).
  const handleReopenReview = (log: DeveloperReview & { developerId: string }) => {
    setReopenContext({
      parentReviewId: log.id,
      parentReviewCode: log.reviewCode,
      taskName: log.taskName,
      devId: log.developerId,
      projectId: log.projectId,
      // El retrabajo del reintento = retrabajo de la revisión que se reabre + 1,
      // así se refleja cuántas veces se ha reabierto esta misma cadena.
      parentRetrabajo: log.kpis.retrabajo
    });
    router.push('/calificar');
  };

  const clearReopenContext = () => setReopenContext(null);

  // Flatten reviews to display in the historical logs list
  const allReviews = useMemo(() => {
    const list: LogEntry[] = [];
    developers.forEach((dev) => {
      dev.reviews.forEach((rev) => {
        list.push({
          ...rev,
          developerName: dev.name,
          developerId: dev.id
        });
      });
    });
    // Sort chronologically (date desc)
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Vincula cada revisión con su reintento/original (reabrir historial) para
    // mostrar ambos puntajes juntos en el detalle, sin afectar los agregados.
    // Van en dos campos separados (retestOf / retestedBy) porque una revisión
    // "de en medio" de la cadena puede ser ambas cosas a la vez.
    const byId = new Map(list.map((r) => [r.id, r]));
    list.forEach((r) => {
      if (r.parentReviewId) {
        const parent = byId.get(r.parentReviewId);
        if (parent) {
          r.retestOf = { id: parent.id, reviewCode: parent.reviewCode, score: parent.score, date: parent.date };
          parent.retestedBy = { id: r.id, reviewCode: r.reviewCode, score: r.score, date: r.date };
        }
      }
    });

    return list;
  }, [developers]);

  // Filter reviews by selected developer name
  const filteredReviews = useMemo(() => {
    if (selectedDeveloper === 'All') return allReviews;
    return allReviews.filter((rev) => rev.developerName.toLowerCase() === selectedDeveloper.toLowerCase());
  }, [allReviews, selectedDeveloper]);

  // Fetch selected developer details
  const selectedDeveloperData = useMemo(() => {
    return developers.find((d) => d.name.toLowerCase() === selectedDeveloper.toLowerCase());
  }, [developers, selectedDeveloper]);

  // KPIs y sparklines calculados con datos reales de las evaluaciones
  const stats = useMemo(() => {
    // Serie real: últimas ~6 evaluaciones en orden cronológico (para las sparklines)
    const buildSeries = (revs: DeveloperReview[], pick: (r: DeveloperReview) => number, fallback: number) => {
      const asc = [...revs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const vals = asc.map(pick).slice(-6);
      if (vals.length === 0) return [fallback, fallback];
      if (vals.length === 1) return [vals[0], vals[0]];
      return vals;
    };

    if (selectedDeveloper !== 'All' && selectedDeveloperData) {
      const dev = selectedDeveloperData;
      const k = dev.kpisTotal;
      return {
        pixelPerfect: k.pixelPerfect,
        erroresVisuales: k.erroresVisuales,
        retrabajo: k.retrabajo,
        kpisTotal: k,
        trendPixel: buildSeries(dev.reviews, (r) => r.kpis.pixelPerfect, k.pixelPerfect),
        trendDod: buildSeries(dev.reviews, (r) => r.kpis.cumplimientoDod, k.cumplimientoDod),
        trendCalidad: buildSeries(dev.reviews, (r) => r.kpis.calidadVisual, k.calidadVisual),
        trendErrores: buildSeries(dev.reviews, (r) => r.kpis.erroresVisuales, 0),
        trendRework: buildSeries(dev.reviews, (r) => r.kpis.retrabajo, 0),
      };
    }

    // Agregado de todo el equipo
    const devCount = developers.length || 1;
    let totalPixel = 0, totalDod = 0, totalCalidad = 0, totalErrores = 0, totalRetrabajo = 0;
    developers.forEach((d) => {
      totalPixel += d.kpisTotal.pixelPerfect;
      totalDod += d.kpisTotal.cumplimientoDod;
      totalCalidad += d.kpisTotal.calidadVisual;
      totalErrores += d.kpisTotal.erroresVisuales;
      totalRetrabajo += d.kpisTotal.retrabajo;
    });

    const kpisTotal = {
      pixelPerfect: Math.round(totalPixel / devCount),
      cumplimientoDod: Math.round(totalDod / devCount),
      calidadVisual: Math.round(totalCalidad / devCount),
      erroresVisuales: totalErrores,
      retrabajo: totalRetrabajo,
    };

    return {
      pixelPerfect: kpisTotal.pixelPerfect,
      erroresVisuales: totalErrores,
      retrabajo: totalRetrabajo,
      kpisTotal,
      trendPixel: buildSeries(allReviews, (r) => r.kpis.pixelPerfect, kpisTotal.pixelPerfect),
      trendDod: buildSeries(allReviews, (r) => r.kpis.cumplimientoDod, kpisTotal.cumplimientoDod),
      trendCalidad: buildSeries(allReviews, (r) => r.kpis.calidadVisual, kpisTotal.calidadVisual),
      trendErrores: buildSeries(allReviews, (r) => r.kpis.erroresVisuales, 0),
      trendRework: buildSeries(allReviews, (r) => r.kpis.retrabajo, 0),
    };
  }, [developers, allReviews, selectedDeveloper, selectedDeveloperData]);

  // Score general para el hero del Panel General: score del dev seleccionado,
  // o promedio del equipo cuando el filtro está en "Todos".
  const heroScore = useMemo(() => {
    if (selectedDeveloper !== 'All' && selectedDeveloperData) {
      return selectedDeveloperData.complianceRate;
    }
    if (developers.length === 0) return 100;
    return Math.round(developers.reduce((sum, d) => sum + d.complianceRate, 0) / developers.length);
  }, [developers, selectedDeveloper, selectedDeveloperData]);

  const heroBreakdown = useMemo(() => {
    // Una revisión "En Revisión" o "Rechazada" que ya fue reabierta y resuelta
    // con un reintento no debe seguir contando como pendiente para siempre.
    // Pero una revisión "Aprobada" sí sigue contando como aprobada aunque
    // después se haya reabierto otra vez (por ejemplo, para un ajuste
    // adicional) — aprobar es un resultado válido que no queda "obsoleto".
    // El total, en cambio, cuenta cada evaluación realizada (incluidas las
    // reabiertas), porque representa el trabajo real de QA, no el estado
    // actual de cada tarea.
    const current = filteredReviews.filter((r) => r.status === 'approved' || !r.retestedBy);
    const approved = current.filter((r) => r.status === 'approved').length;
    const inReview = current.filter((r) => r.status === 'in_review').length;
    const rejected = current.filter((r) => r.status === 'rejected').length;
    return { approved, inReview, rejected, total: filteredReviews.length };
  }, [filteredReviews]);

  // Dropdown list
  const developersDropdown = useMemo(() => {
    return developers.map((d) => ({ id: d.id, name: d.name }));
  }, [developers]);

  // Active Dev profile selected in "Perfiles Técnicos"
  const [activeProfileId, setActiveProfileId] = useState(developers[0]?.id || '');
  const activeProfileData = useMemo(() => {
    return developers.find(d => d.id === activeProfileId) || developers[0];
  }, [developers, activeProfileId]);

  // Mantiene "Perfiles Técnicos" sincronizado con el filtro global del Header:
  // si se elige un dev específico arriba, este tab debe abrir directamente su perfil.
  useEffect(() => {
    if (selectedDeveloper !== 'All' && selectedDeveloperData) {
      setActiveProfileId(selectedDeveloperData.id);
    }
  }, [selectedDeveloper, selectedDeveloperData]);

  // Id del dev a preseleccionar en "Calificar Desarrollador" según el filtro global
  const preselectedDevId = selectedDeveloper !== 'All' ? selectedDeveloperData?.id : undefined;

  const value: DashboardDataContextType = {
    developers,
    allProjects,
    projectAssignments,
    selectedDeveloper,
    setSelectedDeveloper,
    selectedDeveloperData,
    developersDropdown,
    allReviews,
    filteredReviews,
    stats,
    heroScore,
    heroBreakdown,
    handleAddReview,
    handleDeleteReview,
    handleReopenReview,
    reopenContext,
    clearReopenContext,
    logJumpTarget,
    handleSelectObservation,
    activeProfileId,
    setActiveProfileId,
    activeProfileData,
    preselectedDevId
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}
