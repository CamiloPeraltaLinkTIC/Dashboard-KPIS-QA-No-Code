'use client';

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import { BugCategoriesDonut } from '@/components/Charts';
import DeveloperSkillsBreakdown from '@/components/DeveloperSkillsBreakdown';
import RecentLogs from '@/components/RecentLogs';
import RecentObservations from '@/components/RecentObservations';
import InteractiveValidator from '@/components/InteractiveValidator';
import ScoreHero from '@/components/ScoreHero';
import DeveloperLeaderboard from '@/components/DeveloperLeaderboard';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/format';
import { deleteKpiReview } from '@/app/actions/admin';

import {
  DeveloperStat,
  DeveloperReview
} from '@/data/mockData';

export default function DashboardHome() {
  const { profile } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedDeveloper, setSelectedDeveloper] = useState('All');
  const [reopenContext, setReopenContext] = useState<{ parentReviewId: string; parentReviewCode?: string; taskName: string; devId: string; projectId?: string; parentRetrabajo: number } | null>(null);
  const [logJumpTarget, setLogJumpTarget] = useState<{ id: string; nonce: number } | null>(null);

  // Desde "Observaciones Recientes": salta al Historial de abajo, con esa fila expandida.
  const handleSelectObservation = (reviewId: string) => {
    setLogJumpTarget({ id: reviewId, nonce: Date.now() });
  };

  const [developers, setDevelopers] = useState<DeveloperStat[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<{ developer_id: string; project_id: string }[]>([]);

  // Fetch real data from Supabase
  React.useEffect(() => {
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
    setCurrentTab('validator');
  };

  // Flatten reviews to display in the historical logs list
  const allReviews = useMemo(() => {
    const list: (DeveloperReview & { developerName: string; developerId: string })[] = [];
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
  React.useEffect(() => {
    if (selectedDeveloper !== 'All' && selectedDeveloperData) {
      setActiveProfileId(selectedDeveloperData.id);
    }
  }, [selectedDeveloper, selectedDeveloperData]);

  // Id del dev a preseleccionar en "Calificar Desarrollador" según el filtro global
  const preselectedDevId = selectedDeveloper !== 'All' ? selectedDeveloperData?.id : undefined;

  return (
    <div className="dashboard-layout">
      {/* Fondo ambiental compartido con el login */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-aurora ambient-aurora-1" />
        <div className="ambient-aurora ambient-aurora-2" />
        <div className="ambient-grid" />
        <div className="ambient-grain" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="main-content">
        <Header
          currentTab={currentTab}
          selectedDeveloper={selectedDeveloper}
          setSelectedDeveloper={setSelectedDeveloper}
          developers={developersDropdown}
        />

        <div className="tab-viewport">
          {currentTab === 'overview' && (
            <div className="view-pane animate-fade-in">
              <ScoreHero
                score={heroScore}
                scopeLabel={selectedDeveloper === 'All' ? 'Todo el equipo' : selectedDeveloper}
                breakdown={heroBreakdown}
              />

              {/* Developer Specific or Team KPIs */}
              <div className="kpi-cards-grid">
                <MetricCard
                  delayMs={150}
                  title="Píxel Perfecto"
                  value={`${stats.kpisTotal.pixelPerfect}/100%`}
                  subtext="Fidelidad respecto al diseño"
                  trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
                  trendType="positive"
                  color="primary"
                  sparklineData={stats.trendPixel}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                />

                <MetricCard
                  delayMs={210}
                  title="Cumplimiento de DoD"
                  value={`${stats.kpisTotal.cumplimientoDod}/100%`}
                  subtext="Definición de Terminado"
                  trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
                  trendType="positive"
                  color="success"
                  sparklineData={stats.trendDod}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  }
                />

                <MetricCard
                  delayMs={270}
                  title="Calidad Visual"
                  value={`${stats.kpisTotal.calidadVisual}/100%`}
                  subtext="Consistencia y acabado UI"
                  trend={selectedDeveloper === 'All' ? "Promedio equipo" : "Individual"}
                  trendType="positive"
                  color="success"
                  sparklineData={stats.trendCalidad}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 3l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z" />
                    </svg>
                  }
                />

                <MetricCard
                  delayMs={330}
                  title="Errores Visuales y de Diseño"
                  value={stats.erroresVisuales}
                  subtext="Detectados por QA"
                  trend={selectedDeveloper === 'All' ? "Total equipo" : "Histórico"}
                  trendType="positive" // menos errores es positivo
                  color="danger"
                  sparklineData={stats.trendErrores}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="8" height="18" x="8" y="3" rx="4" />
                      <path d="M6 10h12M6 14h12M4 7h16M2 17h20" />
                    </svg>
                  }
                />

                <MetricCard
                  delayMs={390}
                  title="Retrabajo"
                  value={stats.retrabajo}
                  subtext="Incidencias devueltas"
                  trend={selectedDeveloper === 'All' ? "Total equipo" : "Re-trabajo"}
                  trendType="positive"
                  color="warning"
                  sparklineData={stats.trendRework}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  }
                />
              </div>

              {/* Developer Competencies and Specific Bug charts */}
              <div className="charts-layout">
                <DeveloperSkillsBreakdown developers={developers} selectedDevId={selectedDeveloper === 'All' ? 'All' : selectedDeveloperData?.id} />
                <BugCategoriesDonut
                  kpis={stats.kpisTotal}
                  developersBreakdown={
                    selectedDeveloper === 'All'
                      ? developers.map((d) => ({ id: d.id, name: d.name, erroresVisuales: d.kpisTotal.erroresVisuales, retrabajo: d.kpisTotal.retrabajo }))
                      : undefined
                  }
                />
              </div>

              {/* Ranking Grid (Main focus) */}
              <DeveloperLeaderboard
                developers={developers}
                highlightedDevId={selectedDeveloper !== 'All' ? selectedDeveloperData?.id : undefined}
              />

              {/* Últimas 5 observaciones (solo con el filtro en "Todos") */}
              {selectedDeveloper === 'All' && (
                <RecentObservations reviews={allReviews.slice(0, 5)} onSelectReview={handleSelectObservation} />
              )}

              {/* Audit history list */}
              <RecentLogs
                logs={filteredReviews}
                onDeleteReview={handleDeleteReview}
                onReopenReview={handleReopenReview}
                jumpTarget={logJumpTarget}
              />
            </div>
          )}

          {currentTab === 'metrics' && (
            <div className="view-pane animate-fade-in">
              <RecentLogs logs={filteredReviews} onDeleteReview={handleDeleteReview} onReopenReview={handleReopenReview} />
            </div>
          )}

          {currentTab === 'validator' && (
            <div className="view-pane animate-fade-in">
              <InteractiveValidator
                onAddReview={handleAddReview}
                developers={developersDropdown}
                projects={allProjects}
                assignments={projectAssignments}
                preselectedDevId={preselectedDevId}
                reopenContext={reopenContext}
                onReopenHandled={() => setReopenContext(null)}
              />
            </div>
          )}

          {currentTab === 'admin' && (
            <div className="view-pane animate-fade-in">
              <AdminPanel />
            </div>
          )}

          {currentTab === 'developers' && (
            <div className="view-pane animate-fade-in">
              {/* Detailed developer profiles tab */}
              <div className="developer-profile-view">
                <div className="dev-profiles-sidebar glass">
                  <h3>Desarrolladores</h3>
                  <div className="dev-profiles-list">
                    {developers.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setActiveProfileId(d.id); setSelectedDeveloper(d.name); }}
                        className={`dev-profile-tab ${activeProfileId === d.id ? 'active' : ''}`}
                      >
                        <span className="tab-avatar">
                          {d.avatarUrl ? <img src={d.avatarUrl} alt={d.name} className="avatar-img" /> : d.avatar}
                        </span>
                        <div className="tab-meta">
                          <strong>{d.name}</strong>
                          <span>{d.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dev-profile-main glass">
                  {activeProfileData ? (
                    <div className="profile-container animate-fade-in">
                      <div className="profile-hero-row">
                        <div className="profile-hero-avatar">
                          {activeProfileData.avatarUrl ? (
                            <img src={activeProfileData.avatarUrl} alt={activeProfileData.name} className="avatar-img" />
                          ) : (
                            activeProfileData.avatar
                          )}
                        </div>
                        <div className="profile-hero-titles">
                          <h2>{activeProfileData.name}</h2>
                          <p>{activeProfileData.role}</p>
                          <span className="profile-badge-rating" style={{ borderColor: 'var(--color-primary)' }}>
                            Score Promedio: {activeProfileData.complianceRate}/100
                          </span>
                        </div>
                        <div className="profile-hero-quickstats">
                          <div className="quick-item tone-primary inspect-corners" style={{ animationDelay: '0ms' }}>
                            <span className="quick-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <path d="M9 12h6M9 16h6" />
                              </svg>
                            </span>
                            <strong>{activeProfileData.totalTasks}</strong>
                            <span className="quick-item-label">Evaluaciones</span>
                          </div>
                          <div className="quick-item tone-success inspect-corners" style={{ animationDelay: '60ms' }}>
                            <span className="quick-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 11 3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                              </svg>
                            </span>
                            <strong>{activeProfileData.approvedFirstTry}</strong>
                            <span className="quick-item-label">Aprobados 1er Intento</span>
                          </div>
                          <div className="quick-item tone-warning inspect-corners" style={{ animationDelay: '120ms' }}>
                            <span className="quick-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                              </svg>
                            </span>
                            <strong>{activeProfileData.kpisTotal.retrabajo}</strong>
                            <span className="quick-item-label">Retrabajo</span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-dashboard-grid">
                        <div className="profile-skills-pane">
                          <DeveloperSkillsBreakdown developers={developers} selectedDevId={activeProfileData.id} />
                        </div>
                        <div className="profile-bugs-pane">
                          <BugCategoriesDonut kpis={activeProfileData.kpisTotal} />
                        </div>
                      </div>

                      <div className="profile-reviews-list-wrapper">
                        <h3>Historial de Auditorías de {activeProfileData.name}</h3>
                        <div className="table-responsive">
                          <table className="logs-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Tarea / Entrega</th>
                                <th>Score</th>
                                <th>Auditor</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeProfileData.reviews.map((rev) => (
                                <tr key={rev.id}>
                                  <td className="log-id-cell">{rev.reviewCode || rev.id}</td>
                                  <td><strong>{rev.taskName}</strong></td>
                                  <td>
                                    <span className={`score-badge ${rev.score >= 90 ? 'score-excellent' : rev.score >= 80 ? 'score-good' : 'score-poor'}`}>
                                      {rev.score}/100
                                    </span>
                                  </td>
                                  <td>{rev.qaAnalyst}</td>
                                  <td>{formatDateTime(rev.date)}</td>
                                  <td>
                                    <span className={`badge ${rev.status === 'approved' ? 'badge-success' : rev.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                      {rev.status === 'approved' ? 'Aprobado' : rev.status === 'rejected' ? 'Rechazado' : 'En revisión'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-profile-selected">
                      <h3>Selecciona un desarrollador</h3>
                      <p>Elige un perfil en el menú izquierdo para auditar sus métricas de calidad.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          margin-left: 260px;
          flex: 1;
          padding: 24px 32px 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: calc(100% - 260px);
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100%;
            padding: 16px;
          }
        }

        .tab-viewport {
          flex: 1;
        }

        .view-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .kpi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .charts-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .charts-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Developer Profiles View Style */
        .developer-profile-view {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .developer-profile-view {
            grid-template-columns: 1fr;
          }
        }

        .dev-profiles-sidebar {
          padding: 16px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dev-profiles-sidebar h3 {
          font-size: 0.95rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .dev-profiles-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dev-profile-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          border-left: 2px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .dev-profile-tab:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
          transform: translateX(2px);
        }

        [data-theme="light"] .dev-profile-tab:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .dev-profile-tab.active {
          background:
            linear-gradient(135deg, hsla(263, 85%, 64%, 0.08), hsla(190, 90%, 50%, 0.04)),
            var(--color-primary-glow);
          border-color: var(--border-color);
          border-left-color: var(--color-primary);
          color: var(--color-primary);
        }

        .tab-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--border-color);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
          overflow: hidden;
          transition: background 0.25s ease, box-shadow 0.25s ease;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dev-profile-tab.active .tab-avatar {
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          box-shadow: var(--shadow-glow);
        }

        .tab-meta {
          display: flex;
          flex-direction: column;
        }

        .tab-meta strong {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .tab-meta span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .dev-profile-main {
          padding: 28px;
          border-radius: var(--radius-md);
          min-height: 400px;
        }

        .profile-hero-row {
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .profile-hero-avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          color: white;
          font-weight: 800;
          font-size: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: var(--shadow-glow);
        }

        .profile-hero-titles h2 {
          font-size: 1.4rem;
          color: var(--text-primary);
        }

        .profile-hero-titles p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .profile-badge-rating {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--color-primary);
          background: var(--color-primary-glow);
        }

        .profile-hero-quickstats {
          margin-left: auto;
          display: flex;
          gap: 20px;
        }

        @media (max-width: 1100px) {
          .profile-hero-quickstats {
            margin-left: 0;
            width: 100%;
            padding-top: 10px;
          }
        }

        .quick-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 18px;
          background:
            linear-gradient(160deg, var(--tone-tint, transparent), var(--bg-app) 65%),
            rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          min-width: 104px;
          opacity: 0;
          animation: quickItemIn 0.45s ease-out forwards;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        [data-theme="light"] .quick-item {
          background:
            linear-gradient(160deg, var(--tone-tint, transparent), rgba(0, 0, 0, 0.01) 65%),
            rgba(0, 0, 0, 0.01);
        }

        .quick-item:hover {
          transform: translateY(-2px);
        }

        @keyframes quickItemIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .quick-item {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        .quick-item.tone-primary {
          --tone-tint: hsla(var(--hue-primary), 85%, 64%, 0.1);
          border-color: hsla(var(--hue-primary), 85%, 64%, 0.22);
        }

        .quick-item.tone-success {
          --tone-tint: hsla(var(--hue-success), 70%, 45%, 0.1);
          border-color: hsla(var(--hue-success), 70%, 45%, 0.22);
        }

        .quick-item.tone-warning {
          --tone-tint: hsla(var(--hue-warning), 85%, 55%, 0.1);
          border-color: hsla(var(--hue-warning), 85%, 55%, 0.22);
        }

        .quick-item-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tone-primary .quick-item-icon {
          color: var(--color-primary);
          background: linear-gradient(135deg, hsla(var(--hue-primary), 85%, 64%, 0.28), hsla(var(--hue-primary), 85%, 64%, 0.08));
        }

        .tone-success .quick-item-icon {
          color: var(--color-success);
          background: linear-gradient(135deg, hsla(var(--hue-success), 70%, 45%, 0.28), hsla(var(--hue-success), 70%, 45%, 0.08));
        }

        .tone-warning .quick-item-icon {
          color: var(--color-warning);
          background: linear-gradient(135deg, hsla(var(--hue-warning), 85%, 55%, 0.28), hsla(var(--hue-warning), 85%, 55%, 0.08));
        }

        .quick-item strong {
          font-family: var(--font-display);
          font-size: 1.3rem;
          color: var(--text-primary);
          font-weight: 700;
          line-height: 1;
        }

        .quick-item-label {
          font-size: 0.64rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 600;
          text-align: center;
        }

        .profile-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 1100px) {
          .profile-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-reviews-list-wrapper h3 {
          font-size: 0.95rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        /* Reusable table overrides for profile review lists */
        .table-responsive {
          overflow-x: auto;
          width: 100%;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }

        .logs-table th {
          padding: 10px 14px;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          font-size: 0.68rem;
          letter-spacing: 0.03em;
        }

        .logs-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .log-id-cell {
          font-family: var(--font-mono);
          color: var(--color-primary);
          font-weight: 600;
        }

        .platform-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.68rem;
          font-weight: 600;
        }

        .score-badge {
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
        }

        .score-excellent {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
        }

        .score-good {
          background: rgba(249, 115, 22, 0.1);
          color: var(--color-warning);
        }

        .score-poor {
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
        }

        .no-profile-selected {
          text-align: center;
          padding: 60px 20px;
        }
      `}</style>
    </div>
  );
}
