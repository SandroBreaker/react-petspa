
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginStage, Profile, Appointment, Pet, Service } from '../types';
import { api } from '../services/api';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co/storage/v1/object/public/site-assets';

interface LoginFlowOverlayProps {
    loginStage: LoginStage;
    setLoginStage: (stage: LoginStage) => void;
    session: any;
    onComplete: () => void;
    loadUserData: (uid: string) => Promise<{ pets: Pet[], apps: Appointment[] }>;
    loadProfile: (uid: string) => Promise<void>;
}

export const LoginFlowOverlay: React.FC<LoginFlowOverlayProps> = ({ 
    loginStage, 
    setLoginStage, 
    session, 
    onComplete,
    loadUserData,
    loadProfile 
}) => {
    const [insightText, setInsightText] = useState('');
    
    useEffect(() => {
        if (loginStage === 'welcome') {
            // Transição automática de Welcome -> Insight após 2s
            const timer = setTimeout(async () => {
                if (session) {
                   // Garante dados atualizados antes do insight
                   const data = await loadUserData(session.user.id);
                   await loadProfile(session.user.id);
                   
                   // Gera insight
                   const petCount = data.pets.length;
                   const appCount = data.apps.length;
                   let text = '';
                   
                   if (petCount === 0) text = "Vi que você ainda não tem pets cadastrados. Vamos resolver isso?";
                   else if (appCount > 0) text = `Que bom te ver! Você tem ${petCount} pets e ${appCount} banhos no histórico.`;
                   else text = `Bem-vindo de volta! Seus ${petCount} pets devem estar precisando de um banho, hein? 😉`;
                   
                   setInsightText(text);
                   setLoginStage('insight');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loginStage, session]); // Dependências corrigidas

    if (loginStage === 'idle') return null;

    return (
        <div className="login-flow-overlay">
            {loginStage === 'authenticating' && (
                <div className="flow-step fade-in">
                    <Loader2 className="spinner-xl" color="white" />
                    <h3>Autenticando...</h3>
                </div>
            )}

            {loginStage === 'welcome' && (
                <div className="flow-step fade-in-up">
                    <div className="welcome-emoji">👋</div>
                    <h2>Bem-vindo(a) à PetSpa!</h2>
                    <p>Estamos preparando seu ambiente...</p>
                </div>
            )}

            {loginStage === 'insight' && (
                <div className="flow-step fade-in-slide">
                     <div className="mascot-insight-circle pulse-animation">
                        <img src={`${BASE_STORAGE_URL}/mst.png`} className="mascot-img-lg" alt="Mascote" />
                     </div>
                     <div className="insight-bubble">
                         <p>"{insightText}"</p>
                     </div>
                     <button className="btn btn-white mt-4" onClick={onComplete}>
                         Ir para meu Perfil
                     </button>
                </div>
            )}
        </div>
    );
};
