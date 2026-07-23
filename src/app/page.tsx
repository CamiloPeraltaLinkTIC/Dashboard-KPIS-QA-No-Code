'use client';

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import { WeeklyBugsChart, BugCategoriesDonut } from '@/components/Charts';
import DeveloperSkillsBreakdown from '@/components/DeveloperSkillsBreakdown';
import RecentLogs from '@/components/RecentLogs';
import InteractiveValidator from '@/components/InteractiveValidator';
import DeveloperLeaderboard from '@/components/DeveloperLeaderboard';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

import {
  mockDevelopers,
  mockWeeklyTrends,
  DeveloperStat,
  DeveloperReview
} from '@/data/mockData';

export default function DashboardHome() {
  const { profile } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedDeveloper, setSelectedDeveloper] = useState('All');
  
  const [developers, setDevelopers] = useState<DeveloperStat[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);

  // Fetch real data from Supabase
  React.useEffect(() => {
    const fetchRealData = async () => {
      if (!profile) return;
      
      try {
        // 1. Fetch Developers
        let devQuery = supabase.from('nocode_profiles').select('*').in('role', ['dev', 'Developer', 'desarrollador']);
        
        const isDev = profile.role === 'dev' || profile.role === 'Developer';
        const isQA = profile.role === 'QA';

        if (isDev) {
          devQuery = devQuery.eq('id', profile.id);
        } else if (isQA) {
          const { data: assignments } = await supabase
            .from('nocode_project_assignments')
            .select('developer_id')
            .eq('qa_id', profile.id);
          const devIds = assignments?.map(a => a.developer_id) || [];
          if (devIds.length > 0) {
            devQuery = devQuery.in('id', devIds);
          } else {
            devQuery = devQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
        
        const { data: devsData, error: devsError } = await devQuery;
        if (devsError || !devsData) return;

        const { data: projectsData } = await supabase
          .from('nocode_projects')
          .select('id, name');
        setAllProjects(projectsData || []);

        const devIds = devsData.map(d => d.id);
        if (devIds.length === 0) {
          setDevelopers([]);
          return;
        }

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
            taskName: k.task_name,
            platform: k.platform as any,
            date: k.created_at.split('T')[0],
            score: k.score || 0,
            status: k.status as any,
            kpis: {
              pixelPerfect: k.pixel_perfect || 0,
              cumplimientoDod: k.cumplimiento_dod || 0,
              calidadVisual: k.calidad_visual || 0,
              erroresVisuales: k.errores_visuales || 0,
              retrabajo: k.retrabajo || 0,
            },
            details: 'Reporte de QA',
            qaAnalyst: (k.qa as any)?.username || 'QA'
          }));

          const totalTasks = reviews.length;
          const approvedFirstTry = reviews.filter(r => r.status === 'approved').length;
          const complianceRate = totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / totalTasks) : 100;
          
          const kpisTotal = {
            pixelPerfect: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.pixelPerfect, 0) / totalTasks) : 100,
            cumplimientoDod: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.cumplimientoDod, 0) / totalTasks) : 100,
            calidadVisual: totalTasks > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.kpis.calidadVisual, 0) / totalTasks) : 100,
            erroresVisuales: reviews.reduce((sum, r) => sum + r.kpis.erroresVisuales, 0),
            retrabajo: reviews.reduce((sum, r) => sum + r.kpis.retrabajo, 0),
          };

          return {
            id: devRow.id,
            name: devRow.full_name || devRow.username || 'Unknown',
            role: 'No-Code Developer',
            avatar: (devRow.username || 'D').substring(0, 2).toUpperCase(),
            approvedFirstTry,
            totalTasks,
            avgFixTimeHours: 24, // Placeholder since we don't track MTTR yet
            complianceRate,
            skillsScore: { structure: 90, performance: 85, security: 80, ux: 95 }, // Placeholder
            kpisTotal,
            reviews: reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
        });

        setDevelopers(realDevelopers);
        if (realDevelopers.length > 0) {
          // Si el seleccionado no existe en la lista, selecciona el primero
          if (selectedDeveloper !== 'All' && !realDevelopers.some(d => d.id === selectedDeveloper)) {
            setSelectedDeveloper(profile.role === 'dev' ? realDevelopers[0].id : 'All');
          }
        }
      } catch (e) {
        console.error('Error fetching real data:', e);
      }
    };
    
    fetchRealData();
  }, [profile]);

  const handleAddReview = async (devId: string, projectId: string, newReview: DeveloperReview) => {
    // Attempt to save to Supabase
    if (profile?.id) {
      try {
        const { data, error } = await supabase.from('nocode_kpis').insert([{
          developer_id: devId,
          qa_analyst_id: profile.id,
          project_id: projectId || null,
          task_name: newReview.taskName,
          platform: newReview.platform,
          score: newReview.score,
          status: newReview.status,
          pixel_perfect: newReview.kpis.pixelPerfect,
          cumplimiento_dod: newReview.kpis.cumplimientoDod,
          calidad_visual: newReview.kpis.calidadVisual,
          errores_visuales: newReview.kpis.erroresVisuales,
          retrabajo: newReview.kpis.retrabajo,
          month: new Date().toISOString().substring(0, 7)
        }]).select('id, created_at').single();
        
        if (error) {
          console.error('Error saving to Supabase:', error);
          alert('Error al guardar: ' + error.message);
          return;
        }

        // Update local state smoothly
        newReview.id = data.id;
        newReview.date = data.created_at.split('T')[0];
        
        setDevelopers((prevDevs) => {
          return prevDevs.map((dev) => {
            if (dev.id === devId) {
              const updatedReviews = [newReview, ...dev.reviews];
              const totalTasks = updatedReviews.length;
              const approvedFirstTry = updatedReviews.filter((r) => r.status === 'approved').length;
              const complianceRate = totalTasks > 0 ? Math.round(updatedReviews.reduce((sum, r) => sum + r.score, 0) / totalTasks) : 100;
              
              const kpisTotal = {
                pixelPerfect: totalTasks > 0 ? Math.round(updatedReviews.reduce((sum, r) => sum + r.kpis.pixelPerfect, 0) / totalTasks) : 100,
                cumplimientoDod: totalTasks > 0 ? Math.round(updatedReviews.reduce((sum, r) => sum + r.kpis.cumplimientoDod, 0) / totalTasks) : 100,
                calidadVisual: totalTasks > 0 ? Math.round(updatedReviews.reduce((sum, r) => sum + r.kpis.calidadVisual, 0) / totalTasks) : 100,
                erroresVisuales: updatedReviews.reduce((sum, r) => sum + r.kpis.erroresVisuales, 0),
                retrabajo: updatedReviews.reduce((sum, r) => sum + r.kpis.retrabajo, 0),
              };

              return {
                ...dev,
                reviews: updatedReviews,
                totalTasks,
                approvedFirstTry,
                complianceRate,
                kpisTotal
              };
            }
            return dev;
          });
        });
      } catch (e) {
        console.error('Error saving to Supabase:', e);
      }
    }
  };

  // Flatten reviews to display in the historical logs list
  const allReviews = useMemo(() => {
    const list: (DeveloperReview & { developerName: string })[] = [];
    developers.forEach((dev) => {
      dev.reviews.forEach((rev) => {
        list.push({
          ...rev,
          developerName: dev.name
        });
      });
    });
    // Sort chronologically (date desc)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  // Dynamic statistics mapping (Filters by developer if selected)
  const stats = useMemo(() => {
    if (selectedDeveloper !== 'All' && selectedDeveloperData) {
      const dev = selectedDeveloperData;
      const total = dev.reviews.length || 1;
      const approvedCount = dev.reviews.filter((r) => r.status === 'approved').length;
      const rejectedCount = dev.reviews.filter((r) => r.status === 'rejected').length;
      
      const passRate = Math.round((approvedCount / total) * 100);
      const rejectionRate = Math.round((rejectedCount / total) * 100);
      
      const totalErroresVisuales = dev.kpisTotal.erroresVisuales;
      const totalRetrabajo = dev.kpisTotal.retrabajo;
      
      // Historical review scores for sparkline
      const sparkScores = dev.reviews.slice(0, 5).reverse().map((r) => r.score);
      // Fill to at least 4 points
      while (sparkScores.length < 4) {
        sparkScores.unshift(dev.complianceRate);
      }

      return {
        passRate,
        complianceRate: dev.complianceRate,
        pixelPerfect: dev.kpisTotal.pixelPerfect,
        erroresVisuales: totalErroresVisuales,
        retrabajo: totalRetrabajo,
        rejectionRate,
        trendPass: sparkScores,
        trendScore: sparkScores,
        trendErrores: [Math.round(totalErroresVisuales * 1.3), Math.round(totalErroresVisuales * 1.1), Math.round(totalErroresVisuales * 0.9), totalErroresVisuales],
        trendRework: [Math.round(totalRetrabajo * 1.2), Math.round(totalRetrabajo * 1.1), Math.round(totalRetrabajo * 0.9), totalRetrabajo],
        kpisTotal: dev.kpisTotal
      };
    }

    // Default overview statistics (Aggregated across all developers)
    let totalReviews = allReviews.length || 1;
    let approvedCount = allReviews.filter((r) => r.status === 'approved').length;
    let rejectedCount = allReviews.filter((r) => r.status === 'rejected').length;

    const passRate = Math.round((approvedCount / totalReviews) * 100);
    const rejectionRate = Math.round((rejectedCount / totalReviews) * 100);
    
    let sumScore = 0;
    let totalPixelPerfect = 0;
    let totalErroresVisuales = 0;
    let totalRetrabajo = 0;

    developers.forEach((d) => {
      sumScore += d.complianceRate;
      totalPixelPerfect += d.kpisTotal.pixelPerfect;
      totalErroresVisuales += d.kpisTotal.erroresVisuales;
      totalRetrabajo += d.kpisTotal.retrabajo;
    });

    const complianceRate = Math.round(sumScore / developers.length);
    const avgPixelPerfect = Math.round(totalPixelPerfect / developers.length);

    return {
      passRate,
      complianceRate,
      pixelPerfect: avgPixelPerfect,
      erroresVisuales: totalErroresVisuales,
      retrabajo: totalRetrabajo,
      rejectionRate,
      trendPass: [passRate - 5, passRate - 2, passRate + 1, passRate],
      trendScore: [complianceRate - 3, complianceRate - 1, complianceRate + 2, complianceRate],
      trendErrores: [totalErroresVisuales + 8, totalErroresVisuales + 5, totalErroresVisuales + 2, totalErroresVisuales],
      trendRework: [totalRetrabajo + 4, totalRetrabajo + 2, totalRetrabajo - 1, totalRetrabajo],
      kpisTotal: { 
        pixelPerfect: avgPixelPerfect, 
        cumplimientoDod: Math.round(developers.reduce((sum, d) => sum + d.kpisTotal.cumplimientoDod, 0) / developers.length),
        calidadVisual: Math.round(developers.reduce((sum, d) => sum + d.kpisTotal.calidadVisual, 0) / developers.length),
        erroresVisuales: totalErroresVisuales,
        retrabajo: totalRetrabajo
      }
    };
  }, [developers, allReviews, selectedDeveloper, selectedDeveloperData]);

  // Dropdown list
  const developersDropdown = useMemo(() => {
    return developers.map((d) => ({ id: d.id, name: d.name }));
  }, [developers]);

  // Active Dev profile selected in "Perfiles Técnicos"
  const [activeProfileId, setActiveProfileId] = useState(developers[0]?.id || '');
  const activeProfileData = useMemo(() => {
    return developers.find(d => d.id === activeProfileId) || developers[0];
  }, [developers, activeProfileId]);

  return (
    <div className="dashboard-layout">
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
              {/* Developer Specific or Team KPIs */}
              <div className="kpi-cards-grid">
                <MetricCard
                  title="Aprobación a Primer Intento"
                  value={`${stats.passRate}%`}
                  subtext="Cero re-trabajo QA"
                  trend={selectedDeveloper === 'All' ? "+4.2%" : "Individual"}
                  trendType="positive"
                  color="success"
                  sparklineData={stats.trendPass}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Score de Calidad Promedio"
                  value={`${stats.complianceRate}/100`}
                  subtext="Cumplimiento de directrices"
                  trend={selectedDeveloper === 'All' ? "+1.8%" : "Individual"}
                  trendType="positive"
                  color="primary"
                  sparklineData={stats.trendScore}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Errores Visuales"
                  value={stats.erroresVisuales}
                  subtext="Detectados por QA"
                  trend={selectedDeveloper === 'All' ? "-12.5%" : "Histórico"}
                  trendType="positive" // less bugs is positive
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
                  title="Retrabajo Total"
                  value={stats.retrabajo}
                  subtext="Incidencias devueltas"
                  trend={selectedDeveloper === 'All' ? "-2.1%" : "Re-trabajo"}
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
                <BugCategoriesDonut kpis={stats.kpisTotal} />
              </div>

              {/* Ranking Grid (Main focus) */}
              <DeveloperLeaderboard developers={developers} />

              {/* Audit history list */}
              <RecentLogs logs={filteredReviews} />
            </div>
          )}

          {currentTab === 'metrics' && (
            <div className="view-pane animate-fade-in">
              <RecentLogs logs={filteredReviews} />
            </div>
          )}

          {currentTab === 'validator' && (
            <div className="view-pane animate-fade-in">
              <InteractiveValidator onAddReview={handleAddReview} developers={developersDropdown} projects={allProjects} />
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
                        onClick={() => setActiveProfileId(d.id)}
                        className={`dev-profile-tab ${activeProfileId === d.id ? 'active' : ''}`}
                      >
                        <span className="tab-avatar">{d.avatar}</span>
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
                        <div className="profile-hero-avatar">{activeProfileData.avatar}</div>
                        <div className="profile-hero-titles">
                          <h2>{activeProfileData.name}</h2>
                          <p>{activeProfileData.role}</p>
                          <span className="profile-badge-rating" style={{ borderColor: 'var(--color-primary)' }}>
                            Score Promedio: {activeProfileData.complianceRate}/100
                          </span>
                        </div>
                        <div className="profile-hero-quickstats">
                          <div className="quick-item">
                            <span>Evaluaciones</span>
                            <strong>{activeProfileData.totalTasks}</strong>
                          </div>
                          <div className="quick-item">
                            <span>Aprobados 1er Intento</span>
                            <strong>{activeProfileData.approvedFirstTry}</strong>
                          </div>
                          <div className="quick-item">
                            <span>MTTR Bugs</span>
                            <strong>{activeProfileData.avgFixTimeHours}h</strong>
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
                                <th>Plataforma</th>
                                <th>Score</th>
                                <th>Auditor</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeProfileData.reviews.map((rev) => (
                                <tr key={rev.id}>
                                  <td className="log-id-cell">{rev.id}</td>
                                  <td><strong>{rev.taskName}</strong></td>
                                  <td><span className="platform-tag">{rev.platform}</span></td>
                                  <td>
                                    <span className={`score-badge ${rev.score >= 90 ? 'score-excellent' : rev.score >= 80 ? 'score-good' : 'score-poor'}`}>
                                      {rev.score}/100
                                    </span>
                                  </td>
                                  <td>{rev.qaAnalyst}</td>
                                  <td>{rev.date}</td>
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
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: all 0.25s ease;
        }

        .dev-profile-tab:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        [data-theme="light"] .dev-profile-tab:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .dev-profile-tab.active {
          background: var(--color-primary-glow);
          border-color: var(--color-primary);
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
        }

        .dev-profile-tab.active .tab-avatar {
          background: var(--color-primary);
          color: white;
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
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          min-width: 90px;
        }

        .quick-item span {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .quick-item strong {
          font-size: 1.15rem;
          color: var(--text-primary);
          font-weight: 750;
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
