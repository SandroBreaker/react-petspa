
import React, { useState, useEffect } from 'react';
import { Dog } from 'lucide-react';
import { geminiService } from '../services/gemini';

interface MascotProps {
  userName?: string;
  petNames?: string[];
  onClick: () => void;
  visible: boolean;
}

export const Mascot: React.FC<MascotProps> = ({ userName, petNames = [], onClick, visible }) => {
  const [phrase, setPhrase] = useState<string>('Vamos agendar? 🐾');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userName) {
      const fetchPhrase = async () => {
        setLoading(true);
        // Evita chamadas excessivas em dev, na prod pode usar um cache simples
        const cached = sessionStorage.getItem('mascot_phrase');
        if (cached) {
            setPhrase(cached);
        } else {
            const text = await geminiService.generateMascotPhrase(userName, petNames);
            setPhrase(text);
            sessionStorage.setItem('mascot_phrase', text);
        }
        setLoading(false);
      };
      fetchPhrase();
    }
  }, [visible, userName, JSON.stringify(petNames)]);

  if (!visible) return null;

  return (
    <div className="mascot-container fade-in">
      <div className="speech-bubble" onClick={onClick}>
        {loading ? 'Pensando... 🤔' : phrase}
      </div>
      <div className="mascot-icon-wrapper" onClick={onClick}>
         <Dog size={32} strokeWidth={2.5} />
      </div>
    </div>
  );
};
