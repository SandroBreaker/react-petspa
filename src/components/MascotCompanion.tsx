
import React from 'react';
import { X } from 'lucide-react';
import { LoginStage, Route } from '../types';

// URL base do Bucket ATUALIZADA
const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';

interface MascotCompanionProps {
    showBookingModal: boolean;
    view: Route;
    loginStage: LoginStage;
    session: any;
    mascotMessage: string;
    showMascotBubble: boolean;
    setShowMascotBubble: (show: boolean) => void;
    onTriggerBooking: () => void;
    onTriggerLogin: () => void;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
    showBookingModal,
    view,
    loginStage,
    session,
    mascotMessage,
    showMascotBubble,
    setShowMascotBubble,
    onTriggerBooking,
    onTriggerLogin
}) => {
    if (showBookingModal || view === 'chat' || loginStage !== 'idle') return null;
    
    return (
        <div className="mascot-container fade-in-slide">
            {showMascotBubble && mascotMessage && (
                <div className="speech-bubble pop-in">
                    {mascotMessage}
                    <button className="bubble-close" onClick={(e) => { e.stopPropagation(); setShowMascotBubble(false); }}>
                        <X size={10} />
                    </button>
                </div>
            )}
            <div 
                className="mascot-icon-wrapper"
                onClick={() => session ? onTriggerBooking() : onTriggerLogin()}
                onMouseEnter={() => setShowMascotBubble(true)}
            >
                <img 
                  src={`${BASE_STORAGE_URL}/mst.png`} 
                  alt="Mascote" 
                  className="mascot-img"
                />
            </div>
        </div>
    );
};
