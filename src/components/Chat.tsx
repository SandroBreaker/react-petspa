import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Pet, Service } from '../types';
import { Send, Sparkles, User, Bot, X } from 'lucide-react';

interface ChatProps {
  onClose?: () => void;
  onNavigate: (route: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action?: string; payload?: any; nextNode?: string }[];
}

// Knowledge Base Data
const TIPS_DB: Record<string, string> = {
  'hygiene': '🚿 **Banho & Higiene:**\n- Cães de pelo curto: Banho a cada 15-30 dias.\n- Pelo longo: A cada 7-15 dias com escovação diária.\n- **Importante:** Sempre proteja os ouvidos com algodão impermeável!',
  'food': '🍖 **Alimentação:**\n- Evite restos de comida humana.\n- **Proibidos:** Chocolate, Uva, Cebola e Alho.\n- Mantenha água fresca sempre disponível.',
  'behavior': '🎾 **Comportamento:**\n- Passeios diários de 30min reduzem ansiedade.\n- Se o pet destrói móveis, pode estar entediado.',
  'health': '💉 **Saúde:**\n- Vacinas V10 e Antirrábica devem ser anuais.\n- Vermífugo a cada 3-6 meses.'
};

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [flowContext, setFlowContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Input states for dynamic forms
  const [inputType, setInputType] = useState<'text' | 'number' | 'datetime-local' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputHandler, setInputHandler] = useState<((val: string) => Promise<string>) | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isTyping, inputType]);

  const addMessage = (text: string, sender: 'bot' | 'user', options: any[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  const processNode = async (nodeId: string) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600)); // Fake typing delay
    setIsTyping(false);

    // Dynamic Bot Logic based on Node ID
    let node: any = {};

    switch (nodeId) {
      case 'START':
        node = {
          message: 'Olá! Sou o assistente virtual da PetSpa 🐶. Como posso te ajudar hoje?',
          options: [
            { label: '📅 Agendar Banho', nextNode: 'FLOW_SCHEDULE_INIT' },
            { label: '🐶 Raças & Dicas', nextNode: 'KNOWLEDGE_BASE' },
            { label: '🐾 Meus Pets', nextNode: 'CHECK_AUTH_PETS' },
            { label: '👩‍💻 Falar com Humano', nextNode: 'CONTACT' }
          ]
        };
        break;
      
      case 'FLOW_SCHEDULE_INIT':
        const user = await api.auth.getSession();
        if (!user) {
          node = { message: 'Para agendar, preciso que entre na sua conta.', options: [{ label: '🔐 Login', action: 'navLogin' }, { label: '⬅️ Voltar', nextNode: 'START' }] };
        } else {
          const pets = await api.booking.getMyPets(user.user.id);
          if (pets.length === 0) {
            node = { message: 'Você ainda não tem pets. Vamos cadastrar?', options: [{ label: 'Sim', nextNode: 'START' }] }; // Simplify for brevity
          } else {
            node = {
              message: 'Para qual pet seria o agendamento?',
              options: pets.map(p => ({
                label: p.name,
                action: 'setFlowData',
                payload: { key: 'petId', value: p.id },
                nextNode: 'FLOW_SCHEDULE_SERVICE'
              }))
            };
          }
        }
        break;

      case 'FLOW_SCHEDULE_SERVICE':
        const services = await api.booking.getServices();
        node = {
          message: 'Qual serviço vamos realizar?',
          options: services.map(s => ({
            label: `${s.name} (R$ ${s.price})`,
            action: 'setFlowData',
            payload: { key: 'serviceId', value: s.id, extraKey: 'serviceDuration', extraValue: s.duration_minutes },
            nextNode: 'FLOW_SCHEDULE_DATE'
          }))
        };
        break;

      case 'FLOW_SCHEDULE_DATE':
        node = { message: 'Selecione a data e hora:' };
        setInputType('datetime-local');
        setInputHandler(() => async (val: string) => {
          setFlowContext((prev: any) => ({ ...prev, appointmentTime: val }));
          return 'FLOW_SCHEDULE_CONFIRM';
        });
        break;

      case 'FLOW_SCHEDULE_CONFIRM':
        const dateStr = new Date(flowContext.appointmentTime).toLocaleString('pt-BR');
        node = {
          message: `Confirmando: Banho dia ${dateStr}. Posso agendar?`,
          options: [
            { label: '✅ Sim', action: 'finalizeSchedule', nextNode: 'END_SUCCESS' },
            { label: '❌ Cancelar', nextNode: 'START' }
          ]
        };
        break;

      case 'END_SUCCESS':
        node = { 
          message: 'Agendamento realizado com sucesso! 🐾', 
          options: [{ label: '👀 Ver Pedidos', action: 'navTracker' }, { label: '🏠 Menu', nextNode: 'START' }] 
        };
        break;

      case 'KNOWLEDGE_BASE':
        node = {
           message: 'O que deseja saber?',
           options: Object.keys(TIPS_DB).map(k => ({ label: k.toUpperCase(), action: 'showTip', payload: k, nextNode: 'START' }))
        };
        break;
      
      case 'CHECK_AUTH_PETS':
         // Simplified check
         const session = await api.auth.getSession();
         if(!session) {
            node = { message: 'Faça login primeiro.', options: [{label: 'Login', action: 'navLogin'}] };
         } else {
            const myPets = await api.booking.getMyPets(session.user.id);
            node = { message: `Seus pets: ${myPets.map(p => p.name).join(', ')}`, options: [{label: 'Voltar', nextNode: 'START'}] };
         }
         break;

      default:
        node = { message: 'Entendido.', options: [{ label: 'Menu', nextNode: 'START' }] };
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = async (opt: any) => {
    addMessage(opt.label, 'user');
    
    if (opt.action === 'setFlowData') {
      setFlowContext((prev: any) => ({
        ...prev,
        [opt.payload.key]: opt.payload.value,
        ...(opt.payload.extraKey ? { [opt.payload.extraKey]: opt.payload.extraValue } : {})
      }));
    }
    if (opt.action === 'finalizeSchedule') {
      try {
         const { petId, serviceId, appointmentTime, serviceDuration } = flowContext;
         const start = new Date(appointmentTime);
         const end = new Date(start.getTime() + (serviceDuration || 60) * 60000);
         const session = await api.auth.getSession();
         if(session) await api.booking.createAppointment(session.user.id, petId, serviceId, start.toISOString(), end.toISOString());
      } catch (e) { console.error(e); }
    }
    if (opt.action === 'showTip') {
      addMessage(TIPS_DB[opt.payload], 'bot');
    }
    if (opt.action === 'navLogin') onNavigate('login');
    if (opt.action === 'navTracker') onNavigate('dashboard');

    if (opt.nextNode) processNode(opt.nextNode);
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue || !inputHandler) return;
    
    addMessage(inputType === 'datetime-local' ? new Date(inputValue).toLocaleString() : inputValue, 'user');
    setInputType(null);
    
    const nextNode = await inputHandler(inputValue);
    setInputValue('');
    processNode(nextNode);
  };

  useEffect(() => {
    processNode('START');
  }, []);

  return (
    <div id="chat-layout" className="fade-in" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-header">
        <div className="chat-bot-avatar"><Bot /></div>
        <div className="chat-header-text">
          <h3>Assistente PetSpa</h3>
          <span>IA Ativa • Dicas e Agendamento</span>
        </div>
      </div>
      
      <div id="chat-history" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
            {msg.sender === 'bot' && msg.options && (
               <div className="chat-options-container">
                 {msg.options.map((opt, idx) => (
                   <button key={idx} className="chat-option-btn" onClick={() => handleOption(opt)}>
                     {opt.label}
                   </button>
                 ))}
               </div>
            )}
          </div>
        ))}
        {isTyping && (
           <div className="chat-bubble bot" style={{ width: 60 }}>
             <span style={{ animation: 'pulse 1s infinite' }}>...</span>
           </div>
        )}
        
        {inputType && (
          <form onSubmit={handleInputSubmit} className="chat-inline-form fade-in" style={{ marginTop: 16 }}>
             <input 
               type={inputType} 
               className="chat-input-inline" 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)}
               min={inputType === 'datetime-local' ? new Date().toISOString().slice(0,16) : undefined}
               required 
             />
             <button type="submit" className="chat-btn-inline"><Send size={16} /></button>
          </form>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};