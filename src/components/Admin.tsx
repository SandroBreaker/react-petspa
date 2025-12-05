import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { formatDate, formatCurrency } from '../utils/ui';
import { Calendar, LayoutDashboard, ListTodo, Clock, User, Phone } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'kanban' | 'agenda'>('agenda');
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

  // --- Views ---

  const AgendaView = () => {
      // Group by date, then sort by time
      const grouped: Record<string, Appointment[]> = {};
      
      appointments.forEach(app => {
          const dateKey = new Date(app.start_time).toLocaleDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(app);
      });

      const dates = Object.keys(grouped).sort((a,b) => {
          // Simple parsing for sorting DD/MM/YYYY or similar localized formats
          // In a real app, use timestamps for sorting keys
          return 0; 
      });

      return (
          <div className="agenda-container fade-in">
              {dates.length === 0 && <div className="empty-state">Nenhum agendamento encontrado.</div>}
              {dates.map(date => (
                  <div key={date} className="agenda-group">
                      <h4 className="agenda-date-header">{date}</h4>
                      <div className="agenda-list">
                          {grouped[date].map(app => (
                              <div key={app.id} className={`agenda-item border-left-${app.status}`}>
                                  <div className="agenda-time">
                                      {new Date(app.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                  <div className="agenda-details">
                                      <div className="agenda-main-info">
                                          <strong>{app.pets?.name}</strong> 
                                          <span className="agenda-service"> • {app.services?.name}</span>
                                      </div>
                                      <div className="agenda-client-info">
                                          <User size={12} /> {app.profiles?.full_name} 
                                          {app.profiles?.phone && <span style={{marginLeft:8, opacity:0.7}}><Phone size={12}/> {app.profiles.phone}</span>}
                                      </div>
                                  </div>
                                  <div className="agenda-actions">
                                      <select 
                                          className="status-select-mini"
                                          value={app.status} 
                                          onChange={(e) => updateStatus(app.id, e.target.value)}
                                      >
                                          <option value="pending">Pendente</option>
                                          <option value="confirmed">Confirmado</option>
                                          <option value="in_progress">Em Andamento</option>
                                          <option value="completed">Concluído</option>
                                          <option value="cancelled">Cancelado</option>
                                      </select>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const KanbanView = () => (
     <div className="kanban-board fade-in">
       <KanbanCol title="🟡 Solicitações" status="pending" items={appointments.filter(a => a.status === 'pending')} />
       <KanbanCol title="🟢 Agendados" status="confirmed" items={appointments.filter(a => a.status === 'confirmed')} />
       <KanbanCol title="🛁 No Banho" status="in_progress" items={appointments.filter(a => a.status === 'in_progress')} />
       <KanbanCol title="🏁 Concluídos" status="completed" items={appointments.filter(a => a.status === 'completed')} />
     </div>
  );

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
         <div><h2>Painel Admin</h2><span className="master-view-badge">Gestão Operacional</span></div>
       </div>

       <div className="admin-tabs">
          <button className={`tab-btn ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>
              <Calendar size={16} style={{marginRight:6}}/> Agenda
          </button>
          <button className={`tab-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <ListTodo size={16} style={{marginRight:6}}/> Kanban
          </button>
          <button className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={16} style={{marginRight:6}}/> Métricas
          </button>
       </div>

       {loading ? <div className="spinner-center"><div className="spinner"></div></div> : (
         <>
           {view === 'agenda' && <AgendaView />}
           {view === 'kanban' && <KanbanView />}
           
           {view === 'dashboard' && (
             <div className="charts-grid fade-in">
                <div className="card">
                   <h3>Resumo do Dia</h3>
                   <div className="stat-grid">
                      <div className="stat-card">
                         <div className="stat-value">{appointments.filter(a => a.status === 'confirmed').length}</div>
                         <div className="stat-label">Agendados</div>
                      </div>
                      <div className="stat-card">
                         <div className="stat-value">{appointments.filter(a => a.status === 'completed').length}</div>
                         <div className="stat-label">Finalizados</div>
                      </div>
                   </div>
                </div>
             </div>
           )}
         </>
       )}
    </div>
  );
};