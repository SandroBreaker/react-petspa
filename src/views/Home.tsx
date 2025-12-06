
import React from 'react';
import { Sparkles, Scissors, Droplet, Heart, Award, ShieldCheck } from 'lucide-react';
import { Route } from '../types';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co/storage/v1/object/public/site-assets';

interface HomePageProps {
    session: any;
    onNavigate: (route: Route) => void;
    onOpenBooking: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ session, onNavigate, onOpenBooking }) => (
    <div className="page-enter">
      <header 
        className="hero-header reveal-on-scroll"
        style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.9), rgba(45, 52, 54, 0.8)), url(${BASE_STORAGE_URL}/bg.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
      >
        <div className="hero-content">
          <h1 className="fade-in-up">Seu pet limpo,<br />feliz e saudável!</h1>
          <p className="fade-in-up delay-1">Confiança, carinho e tecnologia. Agendamento inteligente com IA.</p>
          <div className="hero-actions fade-in-up delay-2">
            <button className="btn btn-primary hero-btn" onClick={() => session ? onOpenBooking() : onNavigate('login')}>
                Agendar Agora
            </button>
            <button className="btn btn-ghost hero-btn-outline" onClick={() => onNavigate('chat')}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>
      </header>
      
      <div className="container">
         <h2 className="section-title reveal-on-scroll">Nossos Serviços</h2>
         <div className="services-preview-grid">
            <div className="service-preview-card reveal-on-scroll" onClick={() => onNavigate('services')}>
                <div className="service-preview-icon"><Scissors /></div><h4>Banho & Tosa</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-1" onClick={() => onNavigate('services')}>
                <div className="service-preview-icon"><Droplet /></div><h4>Hidratação</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-2" onClick={() => onNavigate('services')}>
                <div className="service-preview-icon"><Sparkles /></div><h4>Higiene</h4>
            </div>
            <div className="service-preview-card reveal-on-scroll delay-3" onClick={() => onNavigate('about')}>
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
         <div className="promo-banner mt-4 clickable-card reveal-on-scroll" onClick={() => session ? onOpenBooking() : onNavigate('login')}>
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
