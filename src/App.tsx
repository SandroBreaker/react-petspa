
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet } from './types';
import { Chat } from './components/Chat';
import { AddPetWizard } from './components/AddPetWizard';
import { useToast } from './context/ToastContext';
import { 
  Home, User, MessageCircle, Calendar, Shield, Search, Menu, 
  MapPin, Clock, Share2, Activity, Heart, Eye, EyeOff, ScanLine, Check
} from 'lucide-react';

const BASE_STORAGE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co/storage/v1/object/public/site-assets'; 

type Route = 'start' | 'login' | 'verify' | 'dashboard' | 'wizard' | 'chat';

export default function App() {
  const [view, setView] = useState<Route>('start');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const toast = useToast();

  // Load Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          loadUserData(session.user.id);
          setView('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          loadUserData(session.user.id);
          setView('dashboard');
      } else { 
          setView('start'); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
      try {
         const [p, myPets] = await Promise.all([
             api.auth.getUserProfile(uid),
             api.booking.getMyPets(uid)
         ]);
         setProfile(p);
         setPets(myPets);
      } catch (e) { console.error(e); }
  };

  const handleAddPet = async (petData: Partial<Pet>) => {
      if(!session) return;
      try {
          await api.booking.createPet(session.user.id, petData);
          await loadUserData(session.user.id);
          toast.success('Pet profile created successfully! 🎉');
          setView('dashboard');
      } catch (e) {
          toast.error('Failed to create profile.');
      }
  };

  // --- VIEWS ---

  // 1. Get Started Screen
  const StartScreen = () => (
    <div className="full-height">
       <div className="hero-frame">
          <img src={`${BASE_STORAGE_URL}/bg.jpg`} className="hero-image" alt="Happy Dog" />
       </div>
       <div className="content-sheet">
          <div className="floating-icon-btn">
             <Share2 size={24} />
          </div>
          
          <div className="mt-auto mb-4">
             <div style={{ width: 40, height: 4, background: '#F2C94C', margin: '0 auto 20px', borderRadius: 2 }}></div>
             <h1 style={{ fontSize: '2rem', lineHeight: 1.2 }}>Personalized Pet Profiles</h1>
             <p>Create personalized profiles for each of your beloved pets on PawBuddy.</p>
             
             <button className="btn btn-primary mb-4" onClick={() => setView('login')}>Get started</button>
             <button className="btn text-link" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Sign up later</button>
          </div>
       </div>
    </div>
  );

  // 2. Login/Register Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await api.auth.signIn(email, pass);
            // Session listener handles redirect
        } catch (e) {
            toast.error('Login failed. Check credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="full-height">
           <div className="hero-frame" style={{ height: '35vh', minHeight: 300 }}>
              <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80" className="hero-image" alt="Dog" />
           </div>
           <div className="content-sheet">
              <div className="floating-icon-btn">
                 <User size={28} />
              </div>
              
              <h1 className="mt-auto mb-4">Create account</h1>
              <p>Welcome! Please enter your information below and get started.</p>

              <div className="form-group">
                 <input className="input-modern" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                 <input 
                    className="input-modern" 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="Password" 
                    value={pass} 
                    onChange={e=>setPass(e.target.value)} 
                 />
                 <button 
                   onClick={() => setShowPass(!showPass)}
                   style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', color: '#64748B' }}>
                   {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                 </button>
              </div>

              <div className="form-group">
                  <label className="checkbox-wrapper">
                      <input type="checkbox" />
                      <div className="checkbox-custom"><Check size={16} color="white"/></div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Accept Terms and Conditions</span>
                  </label>
              </div>

              <button className="btn btn-primary mb-4" onClick={handleLogin} disabled={loading}>
                 {loading ? 'Logging in...' : 'Create account'}
              </button>
              <p className="text-center">Already have an account? <span className="text-link" onClick={() => toast.info('Log in flow is same for demo')}>Log in here!</span></p>
           </div>
        </div>
    );
  };

  // 3. Validation Screen (Visual Replica)
  const ValidationScreen = () => (
      <div className="full-height">
          <div className="hero-frame" style={{ height: '40vh' }}>
             <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80" className="hero-image" />
          </div>
          <div className="content-sheet">
              <div className="floating-icon-btn">
                 <ScanLine size={28} />
              </div>
              <h1 className="mt-4">Validation code</h1>
              <p>Check your email inbox and enter the validation code here</p>

              <div className="otp-container">
                 <input className="otp-digit active" value="1" readOnly />
                 <input className="otp-digit active" value="|" readOnly />
                 <input className="otp-digit" />
                 <input className="otp-digit" />
                 <input className="otp-digit" />
              </div>

              <button className="btn btn-primary mt-auto mb-4" onClick={() => setView('dashboard')}>Confirm</button>
              <p className="text-center">Did not receive the code? <span className="text-link">Resend</span></p>
          </div>
      </div>
  );

  // 4. Dashboard (Image 7 Replica)
  const DashboardScreen = () => {
      const featuredPet = pets[0] || { name: 'Maxi', breed: 'Border Collie', photo_url: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=150&q=80' };

      return (
          <div className="full-height fade-enter">
              {/* Header */}
              <div className="dash-header">
                  <div className="user-greeting">
                      <h2>Hello,</h2>
                      <span className="text-main">{profile?.full_name?.split(' ')[0] || 'Esther'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                      <Search color="white" size={24} />
                      <Menu color="white" size={24} onClick={() => api.auth.signOut()} />
                  </div>
              </div>

              {/* Active Profiles */}
              <div className="active-pets-section">
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Active pet profiles</span>
                    <div style={{ background: '#334155', borderRadius: 12, padding: '2px 8px', fontSize: '0.8rem' }}>{pets.length}</div>
                 </div>

                 {/* Main Pet Card */}
                 <div className="pet-main-card" onClick={() => setView('wizard')}>
                     <div>
                         <h3 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{featuredPet.name}</h3>
                         <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Dog | {featuredPet.breed}</p>
                     </div>
                     <img 
                        src={featuredPet.photo_url || 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=150&q=80'} 
                        className="pet-avatar-lg"
                     />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                     <div style={{ width: 24, height: 4, background: 'var(--accent-yellow)', borderRadius: 2 }}></div>
                     <div style={{ width: 4, height: 4, background: '#334155', borderRadius: 2 }}></div>
                     <div style={{ width: 4, height: 4, background: '#334155', borderRadius: 2 }}></div>
                 </div>
              </div>

              {/* Grid Menu */}
              <div className="menu-grid">
                  <div className="menu-card" onClick={() => setView('wizard')}>
                      <div className="menu-icon-circle"><Share2 size={24}/></div>
                      <div>
                          <h4 style={{ margin: 0 }}>Share profile</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add new one</span>
                      </div>
                  </div>
                  <div className="menu-card">
                      <div className="menu-icon-circle" style={{ background: '#FFEAA7', color: '#FD79A8' }}><Activity size={24}/></div>
                      <h4 style={{ margin: 0 }}>Nutrition</h4>
                  </div>
                  <div className="menu-card">
                      <div className="menu-icon-circle" style={{ background: '#81ECEC', color: '#00B894' }}><Heart size={24}/></div>
                      <h4 style={{ margin: 0 }}>Health Card</h4>
                  </div>
                  <div className="menu-card" onClick={() => setView('chat')}>
                      <div className="menu-icon-circle" style={{ background: '#A29BFE', color: '#6C5CE7' }}><MessageCircle size={24}/></div>
                      <h4 style={{ margin: 0 }}>AI Chat</h4>
                  </div>
              </div>

              {/* Mobile Nav */}
              <div className="mobile-nav">
                  <div className="nav-item active"><Home size={24}/></div>
                  <div className="nav-item"><Calendar size={24}/></div>
                  <div className="nav-item-fab" onClick={() => setView('wizard')}>
                      <Activity size={24} />
                  </div>
                  <div className="nav-item" onClick={() => setView('chat')}><MessageCircle size={24}/></div>
                  <div className="nav-item"><User size={24}/></div>
              </div>
          </div>
      );
  };

  return (
    <>
      {view === 'start' && <StartScreen />}
      {view === 'login' && <LoginScreen />}
      {view === 'verify' && <ValidationScreen />}
      {view === 'dashboard' && <DashboardScreen />}
      {view === 'wizard' && <AddPetWizard onClose={() => setView('dashboard')} onComplete={handleAddPet} />}
      {view === 'chat' && <Chat onNavigate={(r) => r === 'home' ? setView('dashboard') : null} />}
    </>
  );
}
