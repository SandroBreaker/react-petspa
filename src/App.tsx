import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service, Route, LoginStage } from './types';
import { Chat } from './components/Chat';
import { AboutUs } from './components/AboutUs';
import { AdminPanel } from './components/Admin';
import { Logo } from './components/Logo';
import { useToast } from './context/ToastContext';
import { Home, MessageCircle, User, Shield } from 'lucide-react';

// Modules
import { LoginFlowOverlay } from './components/LoginFlowOverlay';
import { MascotCompanion } from './components/MascotCompanion';
import { BookingWizard } from './components/BookingWizard';

// Views
import { HomePage } from './views/Home';
import { ServicesPage } from './views/Services';
import { LoginPage, RegisterPage } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { UserProfileView } from './views/Profile';
import { PetDetailsView, AppointmentDetailsView } from './views/Details';

// Dicionário de comentários do Mascote por rota
const MASCOT_COMMENTS: Partial<Record<Route, string[]>> = {
    'home': ['Pronto para um dia de spa? 🛁', 'Seu pet merece o melhor!', 'Toque em Agendar para começar!'],
    'services': ['O Banho Premium é divino! ✨', 'Temos hidratação com cheirinho de morango 🍓', 'Corte de unhas? Deixa com a gente!'],
    'about': ['A Ana e o João são incríveis ❤️', 'Essa história me emociona...', 'Olha eu nas fotos! 📸'],
    'dashboard': ['Sua agenda organizada 📅', 'Não esqueça dos compromissos!', 'Tudo sob controle aqui.'],
    'user-profile': ['Que perfil chique! 💅', 'Seus pets são lindos!', 'Mantenha os dados atualizados.'],
    'admin': ['Modo chefe ativado 🕶️', 'De olho nos números 📈', 'Quem manda é você!'],
    'chat': ['Meu primo digital é muito esperto 🤖', 'Pode perguntar qualquer coisa!', 'Dica: pergunte sobre raças.'],
    'pet-details': ['Aww, que fofura! 😍', 'Detalhes importantes aqui.', 'Histórico impecável.'],
    'appointment-details': ['Acompanhando tudo... 🕵️', 'Fase importante!', 'Quase pronto!'],
    'register': ['Bem-vindo à família! 🐾', 'Preencha tudo com carinho.', 'Quase lá!']
};

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [apps, setApps] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Selection State
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Login Flow State
  const [loginStage, setLoginStage] = useState<LoginStage>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [showMascotBubble, setShowMascotBubble] = useState(false);

  const toast = useToast();

  // Scroll Observer
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
  }, [view, pets, apps, loginStage]);

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
         if (loginStage === 'idle') {
             loadProfile(session.user.id);
             loadUserData(session.user.id);
         }
      } else { 
          setProfile(null); 
          setPets([]); setApps([]); 
          // Não forçar redirect se estiver em register ou login para evitar UX ruim
          if (view !== 'register' && view !== 'login') setView('home'); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Effect para Comentários do Mascote na Navegação
  useEffect(() => {
      if (loginStage !== 'idle') return; 

      const comments = MASCOT_COMMENTS[view];
      if (comments && comments.length > 0) {
          const randomComment = comments[Math.floor(Math.random() * comments.length)];
          setMascotMessage(randomComment);
          setShowMascotBubble(true);
          const timer = setTimeout(() => setShowMascotBubble(false), 5000);
          return () => clearTimeout(timer);
      } else {
          setShowMascotBubble(false);
      }
  }, [view, loginStage]);

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
         return { pets: p, apps: a };
      } catch (e) { console.error(e); return { pets: [], apps: [] }; }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setLoginStage('idle');
    toast.info('Até logo! 👋');
    setView('home');
  };

  const navigateTo = (v: Route) => {
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Main Render ---
  return (
    <div className={view === 'chat' ? 'mode-chat' : ''}>
       
       <LoginFlowOverlay 
          loginStage={loginStage}
          setLoginStage={setLoginStage}
          session={session}
          onComplete={() => { setLoginStage('idle'); navigateTo('user-profile'); }}
          loadUserData={loadUserData}
          loadProfile={loadProfile}
       />

       {showBookingModal && (
         <BookingWizard 
            onClose={() => setShowBookingModal(false)}
            session={session}
            pets={pets}
            services={services}
            navigateTo={navigateTo}
            onSuccess={async () => { await loadUserData(session.user.id); }}
         />
       )}
       
       <MascotCompanion 
          showBookingModal={showBookingModal}
          view={view}
          loginStage={loginStage}
          session={session}
          mascotMessage={mascotMessage}
          showMascotBubble={showMascotBubble}
          setShowMascotBubble={setShowMascotBubble}
          onTriggerBooking={() => setShowBookingModal(true)}
          onTriggerLogin={() => navigateTo('login')}
       />

       {/* Mobile Header (Top Navigation) */}
       <div className="mobile-header-bar">
          <Logo height={32} onClick={() => navigateTo('home')} />
          <div className="mobile-header-nav">
             <button className={`header-icon-btn ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
                <Home size={22}/>
             </button>
             <button className={`header-icon-btn ${view === 'chat' ? 'active' : ''}`} onClick={() => navigateTo('chat')}>
                <MessageCircle size={22}/>
             </button>
             {session ? (
                 <button className={`header-icon-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
                    <User size={22}/>
                 </button>
             ) : (
                 <button className={`header-icon-btn ${view === 'login' ? 'active' : ''}`} onClick={() => navigateTo('login')}>
                    <User size={22}/>
                 </button>
             )}
             {profile?.role === 'admin' && (
                 <button className={`header-icon-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')}>
                    <Shield size={22}/>
                 </button>
             )}
          </div>
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
          {view === 'home' && (
            <HomePage 
                session={session} 
                onNavigate={navigateTo} 
                onOpenBooking={() => setShowBookingModal(true)} 
            />
          )}

          {view === 'services' && (
            <ServicesPage 
                services={services} 
                onNavigate={navigateTo} 
                onOpenBooking={() => setShowBookingModal(true)} 
                session={session} 
            />
          )}
          
          {view === 'login' && (
            <LoginPage 
                onNavigate={navigateTo} 
                setLoginStage={setLoginStage} 
            />
          )}

          {view === 'register' && (
            <RegisterPage 
                onNavigate={navigateTo} 
                setLoginStage={setLoginStage} 
            />
          )}
          
          {view === 'chat' && (
            <Chat onNavigate={(r) => navigateTo(r as Route)} />
          )}
          
          {view === 'about' && <AboutUs />}
          
          {view === 'dashboard' && (
            <Dashboard 
                profile={profile} 
                pets={pets} 
                apps={apps} 
                onNavigate={navigateTo} 
                setSelectedPet={setSelectedPet} 
                setSelectedAppointment={setSelectedAppointment}
                onOpenBooking={() => setShowBookingModal(true)}
            />
          )}
          
          {view === 'admin' && <AdminPanel />}
          
          {view === 'user-profile' && (
            <UserProfileView 
                profile={profile} 
                session={session} 
                pets={pets} 
                apps={apps} 
                onNavigate={navigateTo} 
                setSelectedPet={setSelectedPet} 
            />
          )}
          
          {view === 'pet-details' && (
            <PetDetailsView 
                selectedPet={selectedPet} 
                apps={apps} 
                onNavigate={navigateTo} 
                setSelectedAppointment={setSelectedAppointment} 
            />
          )}
          
          {view === 'appointment-details' && (
            <AppointmentDetailsView 
                selectedAppointment={selectedAppointment} 
                onNavigate={navigateTo} 
            />
          )}
       </main>
    </div>
  );
}