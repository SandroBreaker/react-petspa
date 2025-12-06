
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service } from './types';
import { Chat } from './components/Chat';
import { AboutUs } from './components/AboutUs';
import { AdminPanel } from './components/Admin';
import { Logo } from './components/Logo';
import { useToast } from './context/ToastContext';
import { Home, Sparkles, ShoppingBag, MessageCircle, Calendar, User, Menu, X, LogOut, Scissors, Droplet, Heart, CheckCircle, Clock, MapPin, Phone, Shield, ChevronLeft, CalendarDays, DollarSign, Plus, Star, Award, ShieldCheck, Users, Dog } from 'lucide-react';
import { formatCurrency, formatDate } from './utils/ui';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co/storage/v1/object/public/site-assets'; 

// --- Routing ---
type Route = 'home' | 'services' | 'about' | 'chat' | 'login' | 'register' | 'dashboard' | 'profile' | 'admin' | 'tracker' | 'user-profile' | 'pet-details' | 'appointment-details' | 'booking-wizard';

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [apps, setApps] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Selection State
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Scroll Observer para Animações
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [view, pets, apps]); // Re-executa quando a view ou dados mudam

  // Initial Load
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
      // Pequeno delay ou lógica de transição pode ser adicionada aqui se necessário
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Components ---

  const Mascot = () => {
      if (showBookingModal || view === 'chat') return null;
      
      return (
          <div className="mascot-container fade-in-slide">
              <div className="speech-bubble" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
                  Vamos agendar? 🛁
              </div>
              <div 
                  className="mascot-icon-wrapper"
                  onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}
              >
                  <Dog size={32} strokeWidth={2.5} />
              </div>
          </div>
      );
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
              toast.success('Agendamento realizado com sucesso! 🐾');
              onClose();
          } catch (e) {
              toast.error('Erro ao agendar. Tente novamente.');
          } finally {
              setIsBooking(false);
          }
      };

      return (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>Agendar Banho & Tosa</h3>
                      <button onClick={onClose} className="btn-icon-sm"><X size={20}/></button>
                  </div>
                  
                  <div className="wizard-steps">
                      <div className={`wizard-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                      <div className="wizard-line"></div>
                      <div className={`wizard-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                      <div className="wizard-line"></div>
                      <div className={`wizard-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                  </div>

                  <div className="wizard-body page-enter">
                      {step === 1 && (
                          <div className="fade-in-up">
                              <h4 className="text-center mb-4">Quem vai receber cuidados hoje?</h4>
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
                          <div className="fade-in-up">
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
                          <div className="fade-in-up">
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
                                      <div className="summary-row"><span>Data:</span> <strong>{new Date(wizDate).toLocaleDateString()} às {new Date(wizDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong></div>
                                  </div>
                              )}

                              <div className="wizard-actions">
                                  <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                  <button 
                                    className={`btn btn-primary ${isBooking ? 'loading' : ''}`} 
                                    disabled={!wizDate || isBooking} 
                                    onClick={handleConfirm}
                                  >
                                      {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
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
    <div className="page-enter">
      <header 
        className="hero-header reveal-on-scroll"
        style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(255,140,66,0.8), rgba(255,140,66,0.4)), url(${BASE_STORAGE_URL}/bg.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
      >
        <div className="hero-content">
          <h1 className="fade-in-up">Seu pet limpo,<br />feliz e saudável!</h1>
          <p className="fade-in-up delay-1">Confiança, carinho e tecnologia. Agendamento inteligente com IA.</p>
          <div className="hero-actions fade-in-up delay-2">
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
         <h2 className="section-title reveal-on-scroll">Nossos Serviços</h2>
         <div className="services-preview-grid">
            <div className="service-preview-card reveal-on-scroll" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Scissors /></div><h4>Banho & Tosa</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-1" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Droplet /></div><h4>Hidratação</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-2" onClick={() => navigateTo('services')}>
                <div className="service-preview-icon"><Sparkles /></div><h4>Higiene</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-3" onClick={() => navigateTo('about')}>
                <div className="service-preview-icon"><Heart /></div><h4>Sobre Nós</h4>
            </div>
         </div>
         
         {/* Green Area Content: Why Us */}
         <div className="features-section">
             <h2 className="section-title reveal-on-scroll">Por que a PetSpa?</h2>
             <div className="features-grid">
                <div className="feature-item reveal-on-scroll">
                    <div className="feature-icon"><Award /></div>
                    <h3>Profissionais Certificados</h3>
                    <p>Equipe treinada para lidar com todos os temperamentos.</p>
                </div>
                <div className="feature-item reveal-on-scroll delay-1">
                    <div className="feature-icon"><ShieldCheck /></div>
                    <h3>Ambiente Seguro</h3>
                    <p>Monitoramento e higienização hospitalar constante.</p>
                </div>
                <div className="feature-item reveal-on-scroll delay-2">
                    <div className="feature-icon"><Heart /></div>
                    <h3>Amor em cada detalhe</h3>
                    <p>Produtos hipoalergênicos e tratamento VIP.</p>
                </div>
             </div>
         </div>

         {/* Promo Banner */}
         <div className="promo-banner mt-4 clickable-card reveal-on-scroll" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
            <div className="promo-content">
                <h3>Primeira vez aqui? 🎁</h3>
                <p>Ganhe <strong>10% OFF</strong> no primeiro banho agendando pelo app!</p>
            </div>
            <div className="promo-decoration pulse-animation">🧼</div>
         </div>

         {/* Testimonials */}
         <div className="testimonials-section mt-4 reveal-on-scroll">
            <h2 className="section-title">Quem ama, recomenda</h2>
            <div className="testimonials-scroll">
                <div className="testimonial-card">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"A Mel nunca voltou tão cheirosa! O atendimento é impecável."</p>
                    <small>— Ana P.</small>
                </div>
                <div className="testimonial-card">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Adoro a facilidade de agendar pelo app. Super prático!"</p>
                    <small>— Carlos M.</small>
                </div>
                <div className="testimonial-card">
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>"Confio de olhos fechados. Trataram meu Thor como rei."</p>
                    <small>— Julia S.</small>
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  const ServicesPage = () => (
      <div className="container page-enter" style={{paddingTop:20}}>
          <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('home')}><ChevronLeft /></button>
               <h3>Nossos Serviços</h3>
               <div style={{width: 44}}></div>
          </div>
          <div className="services-list-full">
              {services.map((s, idx) => (
                  <div key={s.id} className="card service-card-detailed reveal-on-scroll" style={{ transitionDelay: `${idx * 0.1}s` }}>
                      <div className="service-icon-large"><Scissors /></div>
                      <div className="service-info-full">
                          <h3>{s.name}</h3>
                          <p>{s.description || 'Procedimento realizado por profissionais qualificados com produtos premium.'}</p>
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
         toast.success('Login realizado com sucesso!');
         navigateTo('dashboard'); 
       } 
       catch (err: any) { 
         toast.error(err.message || 'Erro no login.');
       } finally { 
         setIsSubmitting(false); 
       }
    };
    return (
      <div className="container auth-container page-enter" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 100px)'}}>
        <div className="card auth-card reveal-on-scroll" style={{width:'100%', maxWidth:400, textAlign:'center'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
            <Logo height={60} />
          </div>
          <h1 className="auth-title">Bem-vindo</h1>
          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Senha</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required /></div>
            <button className={`btn btn-primary full-width ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="auth-footer"><a href="#" onClick={()=>navigateTo('register')} className="auth-link">Criar conta</a></div>
        </div>
      </div>
    );
  };

  const UserProfileView = () => (
    <div className="container page-enter" style={{ paddingTop: 20 }}>
       <div className="nav-header">
           <button className="btn-icon-sm" onClick={() => navigateTo('dashboard')}><ChevronLeft /></button>
           <h3>Meu Perfil</h3>
           <div style={{width: 44}}></div>
       </div>

       <div className="profile-header reveal-on-scroll">
           <div className="profile-avatar">{profile?.full_name?.charAt(0)}</div>
           <div>
               <h2 style={{color:'white', marginBottom:4}}>{profile?.full_name}</h2>
               <p style={{color:'rgba(255,255,255,0.8)', margin:0}}>{session?.user.email}</p>
               <span className="status-badge" style={{background:'rgba(255,255,255,0.2)', color:'white', marginTop:8}}>
                  {profile?.role === 'admin' ? 'Administrador' : 'Cliente Vip'}
               </span>
           </div>
       </div>

       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}} className="reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button className="btn-icon-sm" style={{width:32, height:32}} onClick={() => toast.info('Funcionalidade de cadastro em desenvolvimento 🏗️')}><Plus size={16}/></button>
       </div>
       
       {pets.length === 0 ? <p>Nenhum pet cadastrado.</p> : (
         <div className="pet-grid">
           {pets.map(p => (
              <div key={p.id} className="card pet-card clickable-card reveal-on-scroll" onClick={() => { setSelectedPet(p); navigateTo('pet-details'); }}>
                 <div className="pet-icon">🐾</div>
                 <strong>{p.name}</strong>
                 <span className="pet-breed">{p.breed || 'SRD'}</span>
              </div>
           ))}
         </div>
       )}
       
       <div className="card reveal-on-scroll" style={{marginTop: 24}}>
          <h3 style={{marginBottom:16}}>Estatísticas</h3>
          <div className="stat-grid">
              <div className="stat-card">
                 <div className="stat-value">{apps.length}</div>
                 <div className="stat-label">Banhos Realizados</div>
              </div>
              <div className="stat-card">
                 <div className="stat-value">{pets.length}</div>
                 <div className="stat-label">Pets Amados</div>
              </div>
          </div>
       </div>
    </div>
  );

  const PetDetailsView = () => {
     if (!selectedPet) return null;
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);

     return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
           <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('user-profile')}><ChevronLeft /></button>
               <h3>Detalhes do Pet</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card reveal-on-scroll" style={{textAlign:'center', padding: '40px 20px'}}>
               <div className="pet-icon" style={{width: 80, height: 80, fontSize: '2.5rem', margin: '0 auto 16px'}}>🐾</div>
               <h2>{selectedPet.name}</h2>
               <p>{selectedPet.breed || 'Sem raça definida'}</p>
               <div style={{display:'flex', justifyContent:'center', gap: 12, marginTop: 16}}>
                   {selectedPet.weight && <span className="status-badge tag-confirmed">{selectedPet.weight} kg</span>}
                   {selectedPet.notes && <span className="status-badge tag-in_progress">📝 Observações</span>}
               </div>
               {selectedPet.notes && (
                   <div style={{marginTop: 20, background: '#FFF9C4', padding: 12, borderRadius: 12, color: '#FBC02D', fontSize: '0.9rem', textAlign: 'left'}}>
                      <strong>Notas:</strong> {selectedPet.notes}
                   </div>
               )}
           </div>

           <h3 style={{margin: '24px 0 16px'}} className="reveal-on-scroll">Histórico de {selectedPet.name}</h3>
           <div className="card reveal-on-scroll" style={{padding: 0, overflow:'hidden'}}>
               {petHistory.length === 0 ? (
                   <div style={{padding:24, textAlign:'center', color:'#999'}}>Nenhum banho registrado ainda.</div>
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
        <div className="container page-enter" style={{ paddingTop: 20 }}>
            <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => navigateTo('dashboard')}><ChevronLeft /></button>
               <h3>Acompanhamento</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card status-card reveal-on-scroll">
               <div className="status-icon-lg pulse-animation">
                   {app.status === 'pending' && <Clock size={40}/>}
                   {app.status === 'confirmed' && <CheckCircle size={40}/>}
                   {app.status === 'in_progress' && <Droplet size={40}/>}
                   {app.status === 'completed' && <Sparkles size={40}/>}
                   {app.status === 'cancelled' && <X size={40}/>}
               </div>
               <div className="status-title">
                   {isCancelled ? 'Cancelado' : steps[currentStepIdx]?.label || 'Status Desconhecido'}
               </div>
               <p style={{margin:0}}>Pedido #{app.id}</p>

               {!isCancelled && (
                   <div className="progress-track" style={{marginTop: 32}}>
                       {steps.map((step, idx) => {
                           const isActive = idx <= currentStepIdx;
                           return (
                               <div key={step.status} className={`step ${isActive ? 'active' : ''}`}>
                                   <div className={`step-circle ${isActive ? 'active' : ''}`}>
                                       {idx + 1}
                                   </div>
                                   <div className="step-label">{step.label}</div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>

           <div className="card reveal-on-scroll">
               <h3 style={{marginBottom:20}}>Detalhes do Serviço</h3>
               
               <div style={{display:'flex', alignItems:'center', gap:16, marginBottom: 16}}>
                   <div className="service-preview-icon" style={{width: 48, height: 48, margin:0, fontSize:'1.2rem'}}><Scissors size={20}/></div>
                   <div>
                       <strong style={{display:'block', fontSize:'1.1rem'}}>{app.services?.name}</strong>
                       <span style={{color:'#666'}}>{app.services?.duration_minutes} min • {formatCurrency(app.services?.price || 0)}</span>
                   </div>
               </div>

               <hr style={{border:'none', borderTop:'1px solid #eee', margin: '16px 0'}} />

               <div style={{display:'grid', gap: 16}}>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <Calendar size={20} color="#FF8C42" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Data</small>
                           <strong>{new Date(app.start_time).toLocaleDateString()}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <Clock size={20} color="#FF8C42" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Horário</small>
                           <strong>{new Date(app.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <div style={{width:20, textAlign:'center'}}>🐶</div>
                       <div>
                           <small style={{display:'block', color:'#999'}}>Pet</small>
                           <strong>{app.pets?.name}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <DollarSign size={20} color="#00B894" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Total</small>
                           <strong style={{color:'#00B894', fontSize:'1.1rem'}}>{formatCurrency(app.services?.price || 0)}</strong>
                       </div>
                   </div>
               </div>
           </div>
        </div>
      );
  };

  const Dashboard = () => {
    return (
      <div className="container dashboard-grid page-enter" style={{paddingTop: 24}}>
         {/* Left Column: User Context */}
         <div className="dash-col-left">
            <div className="card dashboard-header-card clickable-card reveal-on-scroll" onClick={() => navigateTo('user-profile')}>
               <div className="dashboard-welcome"><h3>Olá, {profile?.full_name?.split(' ')[0]}!</h3><p>Ver meu perfil</p></div>
               <div className="dashboard-icon">
                  {profile?.full_name?.charAt(0) || '🐶'}
               </div>
            </div>
            
            <div className="card reveal-on-scroll" style={{marginTop: 24}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                   <h3 style={{margin:0}}>Meus Pets</h3>
                   <span style={{fontSize:'0.8rem', color:'var(--primary)'}} onClick={() => navigateTo('user-profile')}>Gerenciar</span>
               </div>
               {pets.length === 0 ? <button className="btn btn-secondary btn-sm full-width">Cadastrar Pet</button> : (
                 <div className="pet-grid">
                   {pets.slice(0,4).map(p => (
                      <div key={p.id} className="card pet-card clickable-card" onClick={() => { setSelectedPet(p); navigateTo('pet-details'); }}>
                         <div className="pet-icon">🐾</div><strong style={{fontSize:'0.9rem'}}>{p.name}</strong>
                      </div>
                   ))}
                 </div>
               )}
            </div>
         </div>

         {/* Right Column: Actions & History */}
         <div className="dash-col-right">
            {/* Call to Action - Booking */}
            <div className="card cta-card-gradient reveal-on-scroll">
                <div>
                   <h3 style={{color:'white'}}>Hora do Banho?</h3>
                   <p style={{color:'rgba(255,255,255,0.9)'}}>Agende um horário para seu melhor amigo em poucos cliques.</p>
                </div>
                <button className="btn btn-white" onClick={() => setShowBookingModal(true)}>
                    Agendar Agora
                </button>
            </div>

            <div className="card reveal-on-scroll" style={{marginTop: 20}}>
               <h3>Últimos Agendamentos</h3>
               {apps.length === 0 ? <p style={{color:'#999', padding:'20px 0', textAlign:'center'}}>Nenhum histórico recente.</p> : apps.slice(0, 5).map(a => (
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

  // --- Main Render ---
  return (
    <div className={view === 'chat' ? 'mode-chat' : ''}>
       {showBookingModal && <BookingWizard onClose={() => setShowBookingModal(false)} />}
       
       <Mascot />

       {/* Mobile Header */}
       <div className="mobile-header-bar">
          <Logo height={32} onClick={() => navigateTo('home')} />
          <button className="btn-icon-sm btn-icon-brand" onClick={() => navigateTo('chat')}><MessageCircle size={20}/></button>
       </div>

       {/* Desktop Nav */}
       <header className="desktop-nav">
          <Logo height={40} onClick={() => navigateTo('home')} />
          <nav className="nav-links-desktop">
             <a href="#" className={`nav-link-item ${view === 'home' && 'active'}`} onClick={() => navigateTo('home')}>Início</a>
             <a href="#" className={`nav-link-item ${view === 'services' && 'active'}`} onClick={() => navigateTo('services')}>Serviços</a>
             <a href="#" className={`nav-link-item ${view === 'about' && 'active'}`} onClick={() => navigateTo('about')}>Sobre Nós</a>
             <a href="#" className={`nav-link-item nav-link-cta ${view === 'chat' && 'active'}`} onClick={() => navigateTo('chat')}>Assistente IA</a>
             {session ? (
               <>
                 <a href="#" className="btn btn-primary btn-sm" onClick={() => navigateTo('dashboard')}>Minha Agenda</a>
                 {profile?.role === 'admin' && <a href="#" className="nav-link-item" onClick={() => navigateTo('admin')}>Admin</a>}
                 <a href="#" className="logout-link" onClick={handleLogout} style={{marginLeft: 20, fontSize:'0.9rem'}}>Sair</a>
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
          {view === 'about' && <AboutUs />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'admin' && <AdminPanel />}
          {view === 'user-profile' && <UserProfileView />}
          {view === 'pet-details' && <PetDetailsView />}
          {view === 'appointment-details' && <AppointmentDetailsView />}
       </main>

       {/* Mobile Nav */}
       <nav className="mobile-nav">
          <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}><span className="icon"><Home /></span></a>
          <a href="#" className={`nav-item ${view === 'about' ? 'active' : ''}`} onClick={() => navigateTo('about')}><span className="icon"><Users /></span></a>
          
          {/* Central Action Button */}
          <div className="nav-item-fab" onClick={() => session ? setShowBookingModal(true) : navigateTo('login')}>
             <Plus size={28} />
          </div>

          <a href="#" className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => navigateTo('chat')}><span className="icon"><MessageCircle /></span></a>
          {session ? (
            <a href="#" className={`nav-item ${['dashboard', 'user-profile', 'pet-details', 'appointment-details'].includes(view) ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}><span className="icon"><Calendar /></span></a>
          ) : (
            <a href="#" className={`nav-item ${view === 'login' ? 'active' : ''}`} onClick={() => navigateTo('login')}><span className="icon"><User /></span></a>
          )}
          
          {profile?.role === 'admin' && (
             <a href="#" className={`nav-item ${view === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')} style={{ color: '#FF7675' }}>
               <span className="icon"><Shield /></span>
             </a>
          )}
       </nav>
    </div>
  );
}
