import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/gemini.ts';
import { Send, Sparkles, Bot } from 'lucide-react';

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

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [flowContext, setFlowContext] = useState<any>({});
  
  // Controle de Modo: 'flow' (Botões/Script) ou 'ai' (Conversa Livre)
  const [mode, setMode] = useState<'flow' | 'ai'>('flow');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados de Input
  const [inputType, setInputType] = useState<'text' | 'number' | 'datetime-local' | null>('text'); // Default text para IA
  const [inputValue, setInputValue] = useState('');
  const [inputHandler, setInputHandler] = useState<((val: string) => Promise<string>) | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isTyping, inputType]);

  const addMessage = (text: string, sender: 'bot' | 'user', options: any[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  // --- LÓGICA DE MÁQUINA DE ESTADOS (Fluxo Rígido) ---
  const processNode = async (nodeId: string) => {
    setIsTyping(true);
    setMode('flow'); // Entra em modo fluxo
    await new Promise(r => setTimeout(r, 600));
    setIsTyping(false);

    let node: any = {};

    switch (nodeId) {
      case 'START':
        setInputType('text'); // Permite digitar para IA
        node = {
          message: 'Olá! Sou o assistente virtual da PetSpa 🐶. Use os botões abaixo para ações rápidas ou **digite sua dúvida** para falar com minha IA!',
          options: [
            { label: '📅 Agendar Banho', nextNode: 'FLOW_SCHEDULE_INIT' },
            { label: '🧠 Dicas & Curiosidades', action: 'startAiChat' },
            { label: '🐾 Meus Pets', nextNode: 'CHECK_AUTH_PETS' },
            { label: '👩‍💻 Falar com Humano', nextNode: 'CONTACT' }
          ]
        };
        break;
      
      case 'FLOW_SCHEDULE_INIT':
        setInputType(null); // Bloqueia texto livre durante fluxo crítico
        const user = await api.auth.getSession();
        if (!user) {
          node = { message: 'Para agendar, preciso que entre na sua conta.', options: [{ label: '🔐 Login', action: 'navLogin' }, { label: '⬅️ Voltar', nextNode: 'START' }] };
        } else {
          const pets = await api.booking.getMyPets(user.user.id);
          if (pets.length === 0) {
            node = { message: 'Você ainda não tem pets. Vamos cadastrar?', options: [{ label: 'Sim', nextNode: 'START' }] };
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
        setInputType(null);
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

      case 'CONTACT':
        node = {
           message: 'Você pode nos ligar no (11) 99999-9999 ou nos visitar na Av. Pet, 123.',
           options: [{ label: 'Voltar', nextNode: 'START' }]
        };
        break;
      
      case 'CHECK_AUTH_PETS':
         const session = await api.auth.getSession();
         if(!session) {
            node = { message: 'Faça login primeiro.', options: [{label: 'Login', action: 'navLogin'}] };
         } else {
            const myPets = await api.booking.getMyPets(session.user.id);
            const petsList = myPets.length ? myPets.map(p => p.name).join(', ') : 'Nenhum pet encontrado.';
            node = { message: `Seus pets: ${petsList}`, options: [{label: 'Voltar', nextNode: 'START'}] };
         }
         break;

      default:
        node = { message: 'Entendido.', options: [{ label: 'Menu', nextNode: 'START' }] };
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = async (opt: any) => {
    addMessage(opt.label, 'user');
    
    // Actions Específicas
    if (opt.action === 'startAiChat') {
        setMode('ai');
        addMessage('Modo Inteligente ativado! 🧠\nPode perguntar sobre cuidados, raças, preços ou dicas.', 'bot', [{label: 'Voltar ao Menu', nextNode: 'START'}]);
        return;
    }

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
      } catch (e) { console.error(e); addMessage("Erro ao agendar.", 'bot'); }
    }

    if (opt.action === 'navLogin') onNavigate('login');
    if (opt.action === 'navTracker') onNavigate('dashboard');

    // Navegação de Nós
    if (opt.nextNode) processNode(opt.nextNode);
  };

  // --- HANDLER DE ENVIO (Input Texto/Form) ---
  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Exibe mensagem do usuário
    const userText = inputType === 'datetime-local' ? new Date(inputValue).toLocaleString() : inputValue;
    addMessage(userText, 'user');
    const rawVal = inputValue;
    setInputValue('');

    // 1. Se estiver num fluxo de formulário (inputHandler definido), segue o fluxo
    if (inputHandler) {
        setInputType(null); // Esconde input até o próximo comando
        const nextNode = await inputHandler(rawVal);
        processNode(nextNode);
        return;
    }

    // 2. Se não for fluxo, envia para o Gemini AI
    setIsTyping(true);
    
    // Prepara histórico simples para o Gemini (últimas 6 mensagens para contexto)
    const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

    const aiResponse = await geminiService.sendMessage(history, rawVal);
    
    setIsTyping(false);
    addMessage(aiResponse, 'bot', [{ label: 'Voltar ao Menu', nextNode: 'START' }]);
  };

  useEffect(() => {
    processNode('START');
  }, []);

  return (
    <div id="chat-layout" className="fade-in" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-header">
        <div className="chat-bot-avatar">
            {mode === 'ai' ? <Sparkles size={24} /> : <Bot size={24} />}
        </div>
        <div className="chat-header-text">
          <h3>Assistente PetSpa</h3>
          <span>{mode === 'ai' ? 'Gemini AI Conectado 🧠' : 'Atendimento Automático'}</span>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input - Sempre visível se inputType != null */}
      {inputType && (
          <form onSubmit={handleInputSubmit} className="chat-inline-form fade-in" style={{ padding: '16px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
             <input 
               type={inputType} 
               className="chat-input-inline" 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)}
               placeholder={inputType === 'datetime-local' ? '' : (mode === 'ai' ? 'Pergunte algo à IA...' : 'Digite aqui...')}
               min={inputType === 'datetime-local' ? new Date().toISOString().slice(0,16) : undefined}
               style={{ flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '0 16px', height: '44px' }}
               autoFocus
             />
             <button type="submit" className="btn-icon-sm" style={{ background: 'var(--primary)', color: 'white', width: 44, height: 44 }}>
                <Send size={18} />
             </button>
          </form>
        )}
    </div>
  );
};