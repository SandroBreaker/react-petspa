
import React, { useState } from 'react';
import { api } from '../services/api';
import { Logo } from '../components/Logo';
import { useToast } from '../context/ToastContext';
import { LoginStage, Route } from '../types';

interface LoginPageProps {
    onNavigate: (route: Route) => void;
    setLoginStage: (stage: LoginStage) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, setLoginStage }) => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault(); 
       setIsSubmitting(true);
       try { 
         // Inicia fluxo visual de login
         setLoginStage('authenticating');
         
         const { error } = await api.auth.signIn(email, pass); 
         if (error) throw error;
         
         // Se sucesso, muda para stage de boas vindas
         // O useEffect global no App.tsx vai detectar a sessão e chamar loadData
         setLoginStage('welcome');
       } 
       catch (err: any) { 
         setLoginStage('idle');
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
          <div className="auth-footer"><a href="#" onClick={()=>onNavigate('register')} className="auth-link">Criar conta</a></div>
        </div>
      </div>
    );
};
