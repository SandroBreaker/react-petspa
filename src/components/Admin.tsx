import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate } from '../utils/ui';

export const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'kanban' | 'employees'>('dashboard');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apps = await api.admin.getAllAppointments();
      setAppointments(apps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: number, status: string) => {
     await api.admin.updateStatus(id, status);
     fetchData();
  };

  // Render Kanban Column
  const KanbanCol = ({ title, status, items }: { title: string, status: string, items: Appointment[] }) => (
    <div className="kanban-column">
      <div className="kanban-title">{title} ({items.length})</div>
      {items.map(app => (
        <div key={app.id} className={`kanban-card border-${app.status}`}>
           <div className="kanban-card-header">
             <div className="kanban-date">{formatDate(app.start_time)}</div>
           </div>
           <div className="kanban-pet-name">{app.pets?.name}</div>
           <div className="kanban-client-name">{app.profiles?.full_name}</div>
           <div className="kanban-service-tag">{app.services?.name}</div>
           <div className="kanban-actions" style={{ marginTop: 8 }}>
             {status === 'pending' && <button onClick={() => updateStatus(app.id, 'confirmed')} className="btn-pill-sm btn-action-positive">Aprovar</button>}
             {status === 'confirmed' && <button onClick={() => updateStatus(app.id, 'in_progress')} className="btn-pill-sm btn-action-positive">Iniciar</button>}
             {status === 'in_progress' && <button onClick={() => updateStatus(app.id, 'completed')} className="btn-pill-sm btn-action-positive">Finalizar</button>}
           </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container fade-in" style={{ paddingTop: 20 }}>
       <div className="admin-header">
         <div><h2>Painel Admin</h2><span className="master-view-badge">Master View</span></div>
       </div>

       <div className="admin-tabs">
          <button className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>📊 Visão Geral</button>
          <button className={`tab-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>📋 Operacional</button>
       </div>

       {loading ? <div className="spinner"></div> : (
         <>
           {view === 'dashboard' && (
             <div className="charts-grid fade-in" style={{ display: 'grid', gap: 24 }}>
                <div className="card">
                   <h3>Próximos Agendamentos</h3>
                   {appointments.length === 0 ? <p>Nenhum agendamento.</p> : (
                     appointments.slice(0, 5).map(a => (
                       <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: 12 }}>
                          <div>
                            <strong>{a.pets?.name}</strong> - {a.services?.name}
                            <div style={{fontSize:'0.8rem', color:'#888'}}>{formatDate(a.start_time)}</div>
                          </div>
                          <span className={`status-badge tag-${a.status}`} style={{height:'fit-content'}}>{a.status}</span>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {view === 'kanban' && (
             <div className="kanban-board fade-in">
               <KanbanCol title="🟡 Solicitações" status="pending" items={appointments.filter(a => a.status === 'pending')} />
               <KanbanCol title="🟢 Agendados" status="confirmed" items={appointments.filter(a => a.status === 'confirmed')} />
               <KanbanCol title="🛁 No Banho" status="in_progress" items={appointments.filter(a => a.status === 'in_progress')} />
               <KanbanCol title="🏁 Concluídos" status="completed" items={appointments.filter(a => a.status === 'completed')} />
             </div>
           )}
         </>
       )}
    </div>
  );
};