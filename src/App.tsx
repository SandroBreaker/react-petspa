import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service } from './types';
import { Chat } from './components/Chat';
import { Marketplace } from './components/Marketplace';
import { AdminPanel } from './components/Admin';
import { Home, Sparkles, ShoppingBag, MessageCircle, Calendar, User, Menu, X, LogOut, Scissors, Droplet, Heart, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Assuming react-leaflet is okay or mock it if strictly vanilla logic

// --- Simple Routing ---
type Route = 'home' | 'services' | 'marketplace' | 'chat' | 'login' | 'register' | 'dashboard' | 'profile' | 'admin' | 'tracker';

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackerId, setTrackerId] = useState<number | null>(null);

  // Initial Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setView('home'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const p = await api.auth.getUserProfile(uid);
      setProfile(p);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setView('home');
  };

  // --- Views Components ---
  
  const HomePage = () => (
    <>
      <header className="hero-header">
        <div className="hero-content">
          <h1>Seu pet limpo,<br />feliz e saudável!</h1>
          <p>Confiança, carinho e tecnologia. Agendamento inteligente com IA.</p>
          <div className="hero-actions">
            <button className="btn btn-primary hero-btn" onClick={() => setView(session ? 'dashboard' : 'login')}>Agendar Banho</button>
            <button className="btn btn-ghost hero-btn-outline" onClick={() => setView('chat')}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>
      </header>
      
      <div className="container">
         <h2 className="section-title">Nossos Cuidados</h2>
         <div className="services-preview-grid">
            <div className="service-preview-card"><div className="service-preview-icon"><Scissors /></div><h4>Banho & Tosa</h4></div>
            <div className="service-preview-card"><div className="service-preview-icon"><Droplet /></div><h4>Hidratação</h4></div>
            <div className="service-preview-card"><div className="service-preview-icon"><Sparkles /></div><h4>Higiene</h4></div>
            <div className="service-preview-card"><div className="service-preview-icon"><Heart /></div><h4>Carinho</h4></div>
         </div>
      </div>
    </>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault(); setLoading(true);
       try { await api.auth.signIn(email, pass); setView('dashboard'); } 
       catch (err: any) { alert(err.message); } finally { setLoading(false); }
    };
    return (
      <div className="container auth-container">
        <div className="card auth-card fade-in">
          <h1 className="auth-title">Bem-vindo</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Senha</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required /></div>
            <button className="btn btn-primary" style={{width:'100%'}}>Entrar</button>
          </form>
          <div className="auth-footer"><a href="#" onClick={()=>setView('register')} className="auth-link">Criar conta</a></div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const [pets, setPets] = useState<Pet[]>([]);
    const [apps, setApps] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    
    // Booking Form State
    const [selPet, setSelPet] = useState('');
    const [selServ, setSelServ] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
       if(!session) return;
       Promise.all([
         api.booking.getMyPets(session.user.id),
         api.booking.getMyAppointments(session.user.id),
         api.booking.getServices()
       ]).then(([p, a, s]) => { setPets(p); setApps(a); setServices(s); });
    }, []);

    const handleBook = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
         const serv = services.find(s => s.id === Number(selServ));
         if(!serv) return;
         const start = new Date(date);
         const end = new Date(start.getTime() + serv.duration_minutes * 60000);
         await api.booking.createAppointment(session.user.id, Number(selPet), serv.id, start.toISOString(), end.toISOString());
         alert('Agendado!');
         // Refresh
         const a = await api.booking.getMyAppointments(session.user.id);
         setApps(a);
       } catch (err) { console.error(err); alert('Erro ao agendar'); }
    };

    return (
      <div className="container dashboard-grid" style={{paddingTop: 24}}>
         <div>
            <div className="card dashboard-header-card">
               <div className="dashboard-welcome"><h3>Olá, {profile?.full_name?.split(' ')[0]}!</h3><p>Seu painel.</p></div>
               <div className="dashboard-icon">🐶</div>
            </div>
            
            <h3 style={{marginTop:24}}>Meus Pets</h3>
            {pets.length === 0 ? <button className="btn btn-primary btn-sm">Cadastrar Pet</button> : (
              <div className="pet-grid">
                {pets.map(p => (
                   <div key={p.id} className="card pet-card">
                      <div className="pet-icon">🐾</div><strong>{p.name}</strong>
                   </div>
                ))}
              </div>
            )}
         </div>

         <div>
            <div className="card">
               <h3>Novo Agendamento</h3>
               <form onSubmit={handleBook}>
                  <div className="form-group">
                     <label>Pet</label>
                     <select value={selPet} onChange={e=>setSelPet(e.target.value)} required>
                        <option value="">Selecione</option>
                        {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                  </div>
                  <div className="form-group">
                     <label>Serviço</label>
                     <select value={selServ} onChange={e=>setSelServ(e.target.value)} required>
                        <option value="">Selecione</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                     </select>
                  </div>
                  <div className="form-group">
                     <label>Data</label>
                     <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required />
                  </div>
                  <button className="btn btn-primary" type="submit">Agendar</button>
               </form>
            </div>
            <div className="card" style={{marginTop: 20}}>
               <h3>Histórico</h3>
               {apps.map(a => (
                 <div key={a.id} className="history-item">
                    <div><strong>{a.services?.name}</strong><br/><small>{new Date(a.start_time).toLocaleDateString()}</small></div>
                    <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  // --- Main Layout Render ---
  return (
    <div className={view === 'chat' ? 'mode-chat' : ''}>
       {/* Mobile Header */}
       <div className="mobile-header-bar">
          <div className="brand-text-mobile">🐾 PetSpa</div>
          <button className="btn-icon-sm btn-icon-brand" onClick={() => setView('chat')}><MessageCircle size={20}/></button>
       </div>

       {/* Desktop Nav */}
       <header className="desktop-nav">
          <div className="brand-text-desktop" onClick={() => setView('home')}>🐾 PetSpa</div>
          <nav className="nav-links-desktop">
             <a href="#" className={`nav-link-item ${view === 'home' && 'active'}`} onClick={() => setView('home')}>Início</a>
             <a href="#" className={`nav-link-item ${view === 'marketplace' && 'active'}`} onClick={() => setView('marketplace')}>Loja</a>
             <a href="#" className={`nav-link-item nav-link-cta ${view === 'chat' && 'active'}`} onClick={() => setView('chat')}>Assistente IA</a>
             {session ? (
               <>
                 <a href="#" className="btn btn-primary btn-sm" onClick={() => setView('dashboard')}>Minha Agenda</a>
                 {profile?.role === 'admin' && <a href="#" className="nav-link-item" onClick={() => setView('admin')}>Admin</a>}
                 <a href="#" className="logout-link" onClick={handleLogout} style={{marginLeft: 20, fontSize:'0.9rem'}}>Sair</a>
               </>
             ) : (
               <a href="#" className="btn btn-secondary btn-sm" onClick={() => setView('login')}>Login</a>
             )}
          </nav>
       </header>

       <main id="app">
          {view === 'home' && <HomePage />}
          {view === 'login' && <LoginPage />}
          {view === 'chat' && <Chat onNavigate={(r) => setView(r as Route)} />}
          {view === 'marketplace' && <Marketplace />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'admin' && <AdminPanel />}
       </main>

       {/* Mobile Nav */}
       <nav className="mobile-nav">
          <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}><span className="icon"><Home /></span></a>
          <a href="#" className={`nav-item ${view === 'marketplace' ? 'active' : ''}`} onClick={() => setView('marketplace')}><span className="icon"><ShoppingBag /></span></a>
          <a href="#" className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}><span className="icon"><MessageCircle /></span></a>
          {session ? (
            <a href="#" className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><span className="icon"><Calendar /></span></a>
          ) : (
            <a href="#" className={`nav-item ${view === 'login' ? 'active' : ''}`} onClick={() => setView('login')}><span className="icon"><User /></span></a>
          )}
       </nav>
    </div>
  );
}