
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service } from './types';
import { Chat } from './components/Chat';
import { Marketplace } from './components/Marketplace';
import { AdminPanel } from './components/Admin';
import { Logo } from './components/Logo';
import { Mascot } from './components/Mascot';
import { useToast } from './context/ToastContext';
import { Home, Sparkles, ShoppingBag, MessageCircle, Calendar, User, Plus, Shield, ChevronLeft, CheckCircle, Droplet, Scissors, Clock, DollarSign, Award, ShieldCheck, Heart, X } from 'lucide-react';
import { formatCurrency, formatDate } from './utils/ui';

type Route = 'home' | 'services' | 'marketplace' | 'chat' | 'login' | 'register' | 'dashboard' | 'profile' | 'admin' | 'tracker' | 'user-profile' | 'pet-details' | 'appointment-details' | 'booking-wizard';

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [apps, setApps] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          loadProfile(session.user.id);
          loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          loadProfile(session.user.id);
          loadUserData(session.user.id);
      } else { 
          setProfile(null); 
          setPets([]); setApps([]); 
          setView('home'); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const p = await api.auth.getUserProfile(uid);
      setProfile(p);
    } catch (e) { console.error(e); }
  };

  const loadUserData = async (uid: string) => {
      try {
         const [p, a, s] = await Promise.all([
             api.booking.getMyPets(uid),
             api.booking.getMyAppointments(uid),
             api.booking.getServices()
         ]);
         setPets(p);
         setApps(a);
         setServices(s);
      } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    toast.info('Até logo! 👋');
    setView('home');
  };

  const navigateTo = (v: Route) => {
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const BookingWizard = ({ onClose }: { onClose: () => void }) => {
      const [step, setStep] = useState(1);
      const [wizPet, setWizPet] = useState<number | null>(null);
      const [wizService, setWizService] = useState<Service | null>(null);
      const [wizDate, setWizDate] = useState('');
      const [isBooking, setIsBooking] = useState(false);

      const handleConfirm = async () => {
          if(!wizPet || !wizService || !wizDate) return;
          try {
              setIsBooking(true);
              const start = new Date(wizDate);
              const end = new Date(start.getTime() + wizService.duration_minutes * 60000);
              await api.booking.createAppointment(session.user.id, wizPet, wizService.id, start.toISOString(), end.toISOString());
              await loadUserData(session.user.id);
              toast.success('Agendamento realizado! 🐾');
              onClose();
          } catch (e) {
              toast.error('Erro ao agendar.');
          } finally {
              setIsBooking(false);
          }
      };

      return (
          <div className="modal-overlay fade-in">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>Agendar Banho</h3>
                      <button onClick={onClose} className="btn-icon-sm"><X size={20}/></button>
                  </div>
                  
                  <div className="wizard-steps">
                      <div className={`wizard-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                      <div className="wizard-line"></div>
                      <div className={`wizard-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                      <div className="wizard-line"></div>
                      <div className={`wizard-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                  </div>

                  <div className="wizard-body">
                      {step === 1 && (
                          <div className="fade-in">
                              <h4 className="text-center mb-4">Quem vai receber cuidados?</h4>
                              {pets.length === 0 ? (
                                  <div className="empty-state">
                                      <p>Você não tem pets cadastrados.</p>
                                      <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigateTo('user-profile'); }}>Cadastrar Pet</button>
                                  </div>
                              ) : (
                                  <div className="pet-selection-grid">
                                      {pets.map(p => (
                                          <div key={p.id} 
                                               className={`pet-select-card ${wizPet === p.id ? 'selected' : ''}`}
                                               onClick={() => setWizPet(p.id)}>
                                              <div className="pet-icon">🐾</div>
                                              <span>{p.name}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                              <button className="btn btn-primary full-width mt-4" disabled={!wizPet} onClick={() => setStep(2)}>Continuar</button>
                          </div>
                      )}

                      {step === 2 && (
                          <div className="fade-in">
                              <h4 className="text-center mb-4">Qual serviço?</h4>
                              <div className="services-list-wizard">
                                  {services.map(s => (
                                      <div key={s.id} 
                                           className={`service-select-item ${wizService?.id === s.id ? 'selected' : ''}`}
                                           onClick={() => setWizService(s)}>
                                          <div style={{flex:1}}>
                                              <div className="service-name">{s.name}</div>
                                              <div className="service-meta">{s.duration_minutes} min</div>
                                          </div>
                                          <div className="service-price">{formatCurrency(s.price)}</div>
                                      </div>
                                  ))}
                              </div>
                              <div className="wizard-actions">
                                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
                                  <button className="btn btn-primary" disabled={!wizService} onClick={() => setStep(3)}>Continuar</button>
                              </div>
                          </div>
                      )}

                      {step === 3 && (
                          <div className="fade-in">
                              <h4 className="text-center mb-4">Quando?</h4>
                              <div className="form-group">
                                  <label>Data e Hora</label>
                                  <input type="datetime-local" className="input-lg" value={wizDate} onChange={e => setWizDate(e.target.value)} min={new Date().toISOString().slice(0,16)}/>
                              </div>
                              
                              {wizPet && wizService && wizDate && (
                                  <div className="summary-card">
                                      <div className="summary-row"><span>Pet:</span> <strong>{pets.find(p=>p.id===wizPet)?.name}</strong></div>
                                      <div className="summary-row"><span>Serviço:</span> <strong>{wizService.name}</strong></div>
                                      <div className="summary-row"><span>Valor:</span> <strong>{formatCurrency(wizService.price)}</strong></div>
                                      <div className="summary-row"><span>Data:</span> <strong>{new Date(wizDate).toLocaleDateString()} {new Date(wizDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong></div>
                                  </div>
                              )}

                              <div className="wizard-actions">
                                  <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                  <button 
                                    className={`btn btn-primary ${isBooking ? 'loading' : ''}`} 
                                    disabled={!wizDate || isBooking} 
                                    onClick={handleConfirm}
                                  >
                                      {isBooking ? 'Agendando...' : 'Confirmar'}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };
  
  const HomePage = () => (
    <>
      <header className="hero-header">
        <div className="hero-content">
          <h1>Seu pet limpo,<br />feliz e saudável!</h1>
          <p>Confiança, carinho e tecnologia com IA.</p>
          <div className="hero-actions">
            <button className="btn btn-primary hero-btn" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
                Agendar Agora
            </button>
            <button className="btn btn-ghost hero-btn-outline" onClick={() => navigateTo('chat')}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>
      </header>
      
      <div className="container">
         <h2 className="section-title">Nossos Serviços</h2>
         <div className="services-preview-grid">
            <div className="service-preview-card clickable-card" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Scissors /></div><h4>Banho & Tosa</h4>
            </div>
            <div className="service-preview-card clickable-card" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Droplet /></div><h4>Hidratação</h4>
            </div>
            <div className="service-preview-card clickable-card" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Sparkles /></div><h4>Higiene</h4>
            </div>
            <div className="service-preview-card clickable-card" onClick={() => navigateTo('marketplace')}>
                <div className="service-preview-icon"><ShoppingBag /></div><h4>Boutique</h4>
            </div>
         </div>
         
         <div className="features-section">
             <h2 className="section-title">Por que a PetSpa?</h2>
             <div className="features-grid">
                <div className="feature-item">
                    <div className="feature-icon"><Award /></div>
                    <h3>Certificados</h3>
                    <p>Equipe treinada.</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><ShieldCheck /></div>
                    <h3>Segurança</h3>
                    <p>Monitoramento 24h.</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><Heart /></div>
                    <h3>Amor VIP</h3>
                    <p>Produtos premium.</p>
                </div>
             </div>
         </div>

         <div className="promo-banner mt-4 clickable-card" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
            <div className="promo-content">
                <h3>Primeira vez? 🎁</h3>
                <p>Ganhe <strong>10% OFF</strong> no primeiro banho!</p>
            </div>
            <div className="promo-decoration">🧼</div>
         </div>

         <div className="testimonials-section mt-4">
            <h2 className="section-title">Quem ama, recomenda</h2>
            <div className="testimonials-scroll">
                <div className="testimonial-card">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"A Mel nunca voltou tão cheirosa!"</p>
                    <small>— Ana P.</small>
                </div>
                <div className="testimonial-card">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Super prático agendar pelo app."</p>
                    <small>— Carlos M.</small>
                </div>
            </div>
         </div>
      </div>
    </>
  );

  const ServicesPage = () => (
      <div className="container fade-in" style={{paddingTop:20}}>
          <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('home')}><ChevronLeft /></button>
               <h3>Serviços</h3>
               <div style={{width: 44}}></div>
          </div>
          <div className="services-list-full">
              {services.map(s => (
                  <div key={s.id} className="card service-card-detailed">
                      <div className="service-icon-large"><Scissors /></div>
                      <div className="service-info-full">
                          <h3>{s.name}</h3>
                          <p>{s.description || 'Procedimento premium.'}</p>
                          <div className="service-tags">
                              <span className="tag-pill">⏳ {s.duration_minutes} min</span>
                              <span className="tag-pill-price">{formatCurrency(s.price)}</span>
                          </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => { if(session) setShowBookingModal(true); else navigateTo('login'); }}>
                          Agendar
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault(); 
       setIsSubmitting(true);
       try { 
         await api.auth.signIn(email, pass); 
         toast.success('Bem-vindo de volta!');
         navigateTo('dashboard'); 
       } 
       catch (err: any) { 
         toast.error(err.message || 'Erro no login.');
       } finally { 
         setIsSubmitting(false); 
       }
    };
    return (
      <div className="container auth-container" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 100px)'}}>
        <div className="card auth-card fade-in" style={{width:'100%', maxWidth:360, textAlign:'center'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
            <Logo height={50} />
          </div>
          <h1 className="auth-title" style={{fontSize:'1.5rem'}}>Entrar</h1>
          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Senha</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required /></div>
            <button className={`btn btn-primary full-width ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="auth-footer" style={{marginTop:16, fontSize:'0.9rem'}}><a href="#" onClick={()=>navigateTo('register')} className="auth-link">Criar conta</a></div>
        </div>
      </div>
    );
  };

  const UserProfileView = () => (
    <div className="container fade-in" style={{ paddingTop: 20 }}>
       <div className="nav-header">
           <button className="btn-icon-sm" onClick={() => navigateTo('dashboard')}><ChevronLeft /></button>
           <h3>Meu Perfil</h3>
           <div style={{width: 44}}></div>
       </div>

       <div className="profile-header">
           <div className="profile-avatar">{profile?.full_name?.charAt(0)}</div>
           <div>
               <h2 style={{color:'white', marginBottom:4}}>{profile?.full_name}</h2>
               <p style={{color:'rgba(255,255,255,0.8)', margin:0}}>{session?.user.email}</p>
               <span className="status-badge" style={{background:'rgba(255,255,255,0.2)', color:'white', marginTop:8}}>
                  {profile?.role === 'admin' ? 'Administrador' : 'Cliente Vip'}
               </span>
           </div>
       </div>

       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h3>Meus Pets</h3>
            <button className="btn-icon-sm" style={{width:32, height:32}} onClick={() => toast.info('Em breve: Cadastro de novos pets 🏗️')}><Plus size={16}/></button>
       </div>
       
       {pets.length === 0 ? <p>Nenhum pet cadastrado.</p> : (
         <div className="pet-grid">
           {pets.map(p => (
              <div key={p.id} className="card pet-card clickable-card" onClick={() => { setSelectedPet(p); navigateTo('pet-details'); }}>
                 <div className="pet-icon">🐾</div>
                 <strong>{p.name}</strong>
                 <span className="pet-breed">{p.breed || 'SRD'}</span>
              </div>
           ))}
         </div>
       )}
    </div>
  );

  const PetDetailsView = () => {
     if (!selectedPet) return null;
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);

     return (
        <div className="container fade-in" style={{ paddingTop: 20 }}>
           <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('user-profile')}><ChevronLeft /></button>
               <h3>{selectedPet.name}</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card" style={{textAlign:'center', padding: '30px 20px'}}>
               <div className="pet-icon" style={{width: 70, height: 70, fontSize: '2.2rem', margin: '0 auto 16px'}}>🐾</div>
               <h2>{selectedPet.name}</h2>
               <p>{selectedPet.breed || 'SRD'}</p>
               {selectedPet.notes && (
                   <div style={{marginTop: 16, background: '#FFF9C4', padding: 10, borderRadius: 12, color: '#FBC02D', fontSize: '0.85rem'}}>
                      {selectedPet.notes}
                   </div>
               )}
           </div>

           <h3 style={{margin: '24px 0 16px'}}>Histórico</h3>
           <div className="card" style={{padding: 0, overflow:'hidden'}}>
               {petHistory.length === 0 ? (
                   <div style={{padding:24, textAlign:'center', color:'#999'}}>Nenhum banho ainda.</div>
               ) : (
                   petHistory.map(a => (
                     <div key={a.id} className="history-item clickable-card" onClick={() => { setSelectedAppointment(a); navigateTo('appointment-details'); }} style={{padding: '16px 20px'}}>
                        <div>
                            <strong>{a.services?.name}</strong>
                            <div className="history-meta">{formatDate(a.start_time)}</div>
                        </div>
                        <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                     </div>
                   ))
               )}
           </div>
        </div>
     );
  };

  const AppointmentDetailsView = () => {
      if (!selectedAppointment) return null;
      const app = selectedAppointment;
      const steps = [
          { status: 'pending', label: 'Solicitado' },
          { status: 'confirmed', label: 'Confirmado' },
          { status: 'in_progress', label: 'Em Andamento' },
          { status: 'completed', label: 'Pronto' }
      ];
      
      const currentStepIdx = steps.findIndex(s => s.status === app.status);
      const isCancelled = app.status === 'cancelled';

      return (
        <div className="container fade-in" style={{ paddingTop: 20 }}>
            <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('dashboard')}><ChevronLeft /></button>
               <h3>Pedido #{app.id}</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card status-card">
               <div className="status-icon-lg">
                   {app.status === 'pending' && <Clock size={40}/>}
                   {app.status === 'confirmed' && <CheckCircle size={40}/>}
                   {app.status === 'in_progress' && <Droplet size={40}/>}
                   {app.status === 'completed' && <Sparkles size={40}/>}
                   {app.status === 'cancelled' && <X size={40}/>}
               </div>
               <div className="status-title">
                   {isCancelled ? 'Cancelado' : steps[currentStepIdx]?.label || 'Status'}
               </div>

               {!isCancelled && (
                   <div className="progress-track" style={{marginTop: 32}}>
                       {steps.map((step, idx) => {
                           const isActive = idx <= currentStepIdx;
                           return (
                               <div key={step.status} className={`step ${isActive ? 'active' : ''}`}>
                                   <div className={`step-circle ${isActive ? 'active' : ''}`}>{idx + 1}</div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>

           <div className="card">
               <h3 style={{marginBottom:16}}>Resumo</h3>
               <div style={{display:'grid', gap: 16}}>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <div style={{width:20, textAlign:'center'}}>✂️</div>
                       <div><small style={{display:'block', color:'#999'}}>Serviço</small><strong>{app.services?.name}</strong></div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <Calendar size={20} color="#FF8C42" />
                       <div><small style={{display:'block', color:'#999'}}>Data</small><strong>{new Date(app.start_time).toLocaleDateString()}</strong></div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <div style={{width:20, textAlign:'center'}}>🐶</div>
                       <div><small style={{display:'block', color:'#999'}}>Pet</small><strong>{app.pets?.name}</strong></div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <DollarSign size={20} color="#00B894" />
                       <div><small style={{display:'block', color:'#999'}}>Total</small><strong style={{color:'#00B894'}}>{formatCurrency(app.services?.price || 0)}</strong></div>
                   </div>
               </div>
           </div>
        </div>
      );
  };

  const Dashboard = () => {
    return (
      <div className="container dashboard-grid" style={{paddingTop: 24}}>
         <div className="dash-col-left">
            <div className="card dashboard-header-card clickable-card" onClick={() => navigateTo('user-profile')}>
               <div className="dashboard-welcome"><h3>Olá, {profile?.full_name?.split(' ')[0]}!</h3><p>Ver perfil</p></div>
               <div className="dashboard-icon">{profile?.full_name?.charAt(0)}</div>
            </div>
            
            <div className="card" style={{marginTop: 20}}>
               <h3 style={{margin:0, marginBottom:16}}>Meus Pets</h3>
               {pets.length === 0 ? <button className="btn btn-secondary btn-sm full-width">Cadastrar Pet</button> : (
                 <div className="pet-grid">
                   {pets.slice(0,4).map(p => (
                      <div key={p.id} className="card pet-card clickable-card" onClick={() => { setSelectedPet(p); navigateTo('pet-details'); }}>
                         <div className="pet-icon">🐾</div><strong style={{fontSize:'0.85rem'}}>{p.name}</strong>
                      </div>
                   ))}
                 </div>
               )}
            </div>
         </div>

         <div className="dash-col-right">
            <div className="card cta-card-gradient">
                <div>
                   <h3 style={{color:'white'}}>Banho agendado?</h3>
                   <p style={{color:'rgba(255,255,255,0.9)'}}>Cuide do seu melhor amigo.</p>
                </div>
                <button className="btn btn-white" onClick={() => setShowBookingModal(true)}>Agendar</button>
            </div>

            <div className="card" style={{marginTop: 20}}>
               <h3>Histórico</h3>
               {apps.length === 0 ? <p style={{color:'#999', padding:'20px 0', textAlign:'center'}}>Nenhum histórico.</p> : apps.slice(0, 5).map(a => (
                 <div key={a.id} className="history-item clickable-card" onClick={() => { setSelectedAppointment(a); navigateTo('appointment-details'); }}>
                    <div><strong>{a.services?.name}</strong><br/><small>{new Date(a.start_time).toLocaleDateString()}</small></div>
                    <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className={view === 'chat' ? 'mode-chat' : ''}>
       {showBookingModal && <BookingWizard onClose={() => setShowBookingModal(false)} />}
       
       <Mascot 
          visible={!showBookingModal && view !== 'chat' && view !== 'login'} 
          userName={profile?.full_name?.split(' ')[0]}
          petNames={pets.map(p => p.name)}
          onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}
       />

       <div className="mobile-header-bar">
          <Logo height={32} onClick={() => navigateTo('home')} />
          <button className="btn-icon-sm btn-icon-brand" onClick={() => navigateTo('chat')}><MessageCircle size={20}/></button>
       </div>

       <header className="desktop-nav">
          <Logo height={36} onClick={() => navigateTo('home')} />
          <nav className="nav-links-desktop">
             <a href="#" className={`nav-link-item ${view === 'home' && 'active'}`} onClick={() => navigateTo('home')}>Início</a>
             <a href="#" className={`nav-link-item ${view === 'services' && 'active'}`} onClick={() => navigateTo('services')}>Serviços</a>
             <a href="#" className={`nav-link-item ${view === 'marketplace' && 'active'}`} onClick={() => navigateTo('marketplace')}>Boutique</a>
             <a href="#" className={`nav-link-item nav-link-cta ${view === 'chat' && 'active'}`} onClick={() => navigateTo('chat')}>IA</a>
             {session ? (
               <>
                 <a href="#" className="btn btn-primary btn-sm" onClick={() => navigateTo('dashboard')}>Agenda</a>
                 {profile?.role === 'admin' && <a href="#" className="nav-link-item" onClick={() => navigateTo('admin')}>Admin</a>}
                 <a href="#" className="logout-link" onClick={handleLogout} style={{marginLeft: 20, fontSize:'0.85rem'}}>Sair</a>
               </>
             ) : (
               <a href="#" className="btn btn-secondary btn-sm" onClick={() => navigateTo('login')}>Login</a>
             )}
          </nav>
       </header>

       <main id="app">
          {view === 'home' && <HomePage />}
          {view === 'services' && <ServicesPage />}
          {view === 'login' && <LoginPage />}
          {view === 'chat' && <Chat onNavigate={(r) => navigateTo(r as Route)} />}
          {view === 'marketplace' && <Marketplace />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'admin' && <AdminPanel />}
          {view === 'user-profile' && <UserProfileView />}
          {view === 'pet-details' && <PetDetailsView />}
          {view === 'appointment-details' && <AppointmentDetailsView />}
       </main>

       <nav className="mobile-nav">
          <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}><Home size={22} /></a>
          <a href="#" className={`nav-item ${view === 'marketplace' ? 'active' : ''}`} onClick={() => navigateTo('marketplace')}><ShoppingBag size={22} /></a>
          
          <div className="nav-item-fab" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
             <Plus size={28} />
          </div>

          <a href="#" className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => navigateTo('chat')}><MessageCircle size={22} /></a>
          {session ? (
            <a href="#" className={`nav-item ${['dashboard', 'user-profile', 'pet-details', 'appointment-details'].includes(view) ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}><Calendar size={22} /></a>
          ) : (
            <a href="#" className={`nav-item ${view === 'login' ? 'active' : ''}`} onClick={() => navigateTo('login')}><User size={22} /></a>
          )}
          
          {profile?.role === 'admin' && (
             <a href="#" className={`nav-item ${view === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')} style={{ color: '#FF7675' }}>
               <Shield size={22} />
             </a>
          )}
       </nav>
    </div>
  );
}
