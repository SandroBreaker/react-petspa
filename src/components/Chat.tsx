import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/gemini';
import { Send, Sparkles, Bot, ChevronLeft, User, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/ui';

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
  const [isProcessingAction, setIsProcessingAction] = useState(false); // Novo estado para overlay
  const [flowContext, setFlowContext] = useState<any>({});
  
  // Controle de Modo: 'flow' (Botões/Script) ou 'ai' (Conversa Livre)
  const [mode, setMode] = useState<'flow' | 'ai'>('flow');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Estados de Input
  const [inputType, setInputType] = useState<'text' | 'number' | 'datetime-local' | null>('text');
  const [inputValue, setInputValue] = useState('');
  const [inputHandler, setInputHandler] = useState<((val: string) => Promise<string>) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, inputType]);

  // Adjust scroll when keyboard opens (window resize)
  useEffect(() => {
    const handleResize = () => scrollToBottom();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addMessage = (text: string, sender: 'bot' | 'user', options: any[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  // --- LÓGICA DE MÁQUINA DE ESTADOS (Fluxo Rígido) ---
  const processNode = async (nodeId: string) => {
    setIsTyping(true);
    setMode('flow');
    
    // Delay natural de "pensando"
    await new Promise(r => setTimeout(r, 800)); 
    
    setIsTyping(false);
    setIsProcessingAction(false); // Libera o overlay

    let node: any = {};

    switch (nodeId) {
      case 'START':
        setInputType('text');
        node = {
          message: 'Olá! Sou o assistente virtual da PetSpa 🐶. Como posso te ajudar hoje?',
          options: [
            { label: '📅 Agendar Banho', nextNode: 'FLOW_SCHEDULE_INIT' },
            { label: '🧠 Dicas com IA', action: 'startAiChat' },
            { label: '🐾 Meus Pets', nextNode: 'CHECK_AUTH_PETS' },
            { label: '📍 Endereço e Contato', nextNode: 'CONTACT' }
          ]
        };
        break;
      
      case 'FLOW_SCHEDULE_INIT':
        setInputType(null);
        const user = await api.auth.getSession();
        if (!user) {
          node = { message: 'Para agendar, preciso que entre na sua conta.', options: [{ label: '🔐 Fazer Login', action: 'navLogin' }, { label: '⬅️ Voltar', nextNode: 'START' }] };
        } else {
          const pets = await api.booking.getMyPets(user.user.id);
          if (pets.length === 0) {
            node = { message: 'Você ainda não tem pets cadastrados no sistema.', options: [{ label: 'Cadastrar Agora', action: 'navProfile' }, { label: 'Voltar', nextNode: 'START' }] };
          } else {
            node = {
              message: 'Para qual pet seria o agendamento?',
              options: pets.map(p => ({
                label: p.name,
                action: 'setFlowData',
                payload: { petId: p.id, petName: p.name },
                nextNode: 'FLOW_SCHEDULE_SERVICE'
              }))
            };
          }
        }
        break;

      case 'FLOW_SCHEDULE_SERVICE':
        setInputType(null);
        const services = await api.booking.getServices();
        node = {
          message: 'Qual serviço você gostaria?',
          options: services.map(s => ({
            label: `${s.name} (${formatCurrency(s.price)})`,
            action: 'setFlowData',
            payload: { 
              serviceId: s.id, 
              serviceName: s.name, 
              servicePrice: s.price, 
              serviceDuration: s.duration_minutes 
            },
            nextNode: 'FLOW_SCHEDULE_DATE'
          }))
        };
        break;

      case 'FLOW_SCHEDULE_DATE':
        const { petName, serviceName, servicePrice, serviceDuration } = flowContext;
        node = { 
          message: `Ótima escolha! 🛁\n\nServiço: **${serviceName}**\nPet: **${petName}**\nDuração: ~${serviceDuration} min\nValor: **${formatCurrency(servicePrice)}**\n\nQual a melhor data e horário para você?`,
          options: [
             { label: '⬅️ Escolher outro serviço', nextNode: 'FLOW_SCHEDULE_SERVICE' }
          ]
        };
        setInputType('datetime-local');
        setInputHandler(() => async (val: string) => {
          setFlowContext((prev: any) => ({ ...prev, appointmentTime: val }));
          return 'FLOW_SCHEDULE_CONFIRM';
        });
        break;

      case 'FLOW_SCHEDULE_CONFIRM':
        setInputType(null);
        const dateStr = new Date(flowContext.appointmentTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        node = {
          message: `Confirma o agendamento de **${flowContext.serviceName}** para **${flowContext.petName}** no dia **${dateStr}**?`,
          options: [
            { label: '✅ Sim, Confirmar', action: 'finalizeSchedule', nextNode: 'END_SUCCESS' },
            { label: '❌ Cancelar', nextNode: 'START' }
          ]
        };
        break;

      case 'END_SUCCESS':
        node = { 
          message: 'Perfeito! Seu agendamento foi realizado. 🐾', 
          options: [{ label: '👀 Acompanhar Pedido', action: 'navTracker' }, { label: '🏠 Voltar ao Início', nextNode: 'START' }] 
        };
        break;

      case 'CONTACT':
        node = {
           message: 'Estamos na Av. Pet, 123.\n📞 Tel: (11) 99999-9999\n⏰ Seg-Sex: 09h às 18h',
           options: [{ label: 'Obrigado', nextNode: 'START' }]
        };
        break;
      
      case 'CHECK_AUTH_PETS':
         const session = await api.auth.getSession();
         if(!session) {
            node = { message: 'Você precisa estar logado.', options: [{label: 'Fazer Login', action: 'navLogin'}] };
         } else {
            const myPets = await api.booking.getMyPets(session.user.id);
            const petsList = myPets.length ? myPets.map(p => p.name).join(', ') : 'Nenhum pet encontrado.';
            node = { 
                message: `Seus pets cadastrados: ${petsList}`, 
                options: [
                    {label: '👤 Ir para Perfil', action: 'navProfile'},
                    {label: 'Voltar', nextNode: 'START'}
                ] 
            };
         }
         break;

      default:
        node = { message: 'Entendido.', options: [{ label: 'Menu Principal', nextNode: 'START' }] };
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = async (opt: any) => {
    setIsProcessingAction(true); // Ativa overlay de processamento
    addMessage(opt.label, 'user');
    
    // Pequena pausa para sensação de processamento do clique
    await new Promise(r => setTimeout(r, 400));

    // Actions Específicas
    if (opt.action === 'startAiChat') {
        setMode('ai');
        setIsProcessingAction(false);
        addMessage('Modo IA ativado! 🧠\nPergunte sobre raças, dicas de saúde ou cuidados.', 'bot', [{label: 'Encerrar IA', nextNode: 'START'}]);
        return;
    }

    if (opt.action === 'setFlowData') {
      setFlowContext((prev: any) => ({
        ...prev,
        ...opt.payload // Spread direto do payload (suporta multiplas chaves)
      }));
    }

    if (opt.action === 'finalizeSchedule') {
      try {
         const { petId, serviceId, appointmentTime, serviceDuration } = flowContext;
         const start = new Date(appointmentTime);
         const end = new Date(start.getTime() + (serviceDuration || 60) * 60000);
         const session = await api.auth.getSession();
         if(session) await api.booking.createAppointment(session.user.id, petId, serviceId, start.toISOString(), end.toISOString());
      } catch (e) { console.error(e); addMessage("Houve um erro técnico.", 'bot'); }
    }

    if (opt.action === 'navLogin') onNavigate('login');
    if (opt.action === 'navTracker') onNavigate('dashboard');
    if (opt.action === 'navProfile') onNavigate('user-profile');

    if (opt.nextNode) processNode(opt.nextNode);
    else setIsProcessingAction(false); // Se não tiver nextNode, libera
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const userText = inputType === 'datetime-local' ? new Date(inputValue).toLocaleString() : inputValue;
    addMessage(userText, 'user');
    const rawVal = inputValue;
    setInputValue('');
    setIsProcessingAction(true);

    // 1. Fluxo de Input Específico
    if (inputHandler) {
        setInputType(null); 
        const nextNode = await inputHandler(rawVal);
        processNode(nextNode);
        return;
    }

    // 2. Chat Inteligente (Gemini)
    setIsTyping(true);
    setIsProcessingAction(false); // Libera overlay para mostrar typing
    const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

    const aiResponse = await geminiService.sendMessage(history, rawVal);
    
    setIsTyping(false);
    addMessage(aiResponse, 'bot', [{ label: 'Menu Principal', nextNode: 'START' }]);
  };

  useEffect(() => {
    processNode('START');
  }, []);

  return (
    <div className="chat-layout">
      {/* Overlay de Processamento */}
      {isProcessingAction && (
        <div className="chat-processing-overlay fade-in">
          <Loader2 className="spinner" size={48} color="white" />
          <p>Processando...</p>
        </div>
      )}

      {/* Header Fixo */}
      <div className="chat-header-modern">
        <button onClick={() => onNavigate('home')} className="btn-icon-sm btn-ghost-white">
          <ChevronLeft />
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar-ring">
             {mode === 'ai' ? <Sparkles size={20} /> : <Bot size={20} />}
          </div>
          <div>
            <h3 className="chat-title">Assistente PetSpa</h3>
            <div className="chat-status">
              <span className="status-dot"></span>
              {mode === 'ai' ? 'IA Conectada' : 'Online'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de Mensagens (Scroll) */}
      <div className="chat-messages-area">
        <div className="chat-date-divider">
           <span>Hoje</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
            {msg.sender === 'bot' && (
                <div className="chat-msg-avatar">
                   {mode === 'ai' ? <Sparkles size={14} /> : <Bot size={14} />}
                </div>
            )}
            
            <div className="chat-bubble-group">
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                </div>

                {msg.sender === 'bot' && msg.options && msg.options.length > 0 && (
                  <div className="chat-options-grid fade-in-slide delay-options">
                    {msg.options.map((opt, idx) => (
                      <button key={idx} className="chat-chip-btn" onClick={() => handleOption(opt)} disabled={isProcessingAction}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            
            {msg.sender === 'user' && (
                <div className="chat-msg-avatar user-avatar-icon">
                    <User size={14} />
                </div>
            )}
          </div>
        ))}

        {isTyping && (
           <div className="chat-row row-bot">
             <div className="chat-msg-avatar"><Bot size={14} /></div>
             <div className="chat-bubble bubble-bot typing-bubble">
               <span className="dot"></span><span className="dot"></span><span className="dot"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Input Area (Footer) */}
      {inputType && (
          <form onSubmit={handleInputSubmit} className="chat-footer-modern">
             <input 
               ref={inputRef}
               type={inputType} 
               className="chat-input-modern" 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)}
               placeholder={inputType === 'datetime-local' ? '' : (mode === 'ai' ? 'Digite para a IA...' : 'Digite sua resposta...')}
               min={inputType === 'datetime-local' ? new Date().toISOString().slice(0,16) : undefined}
             />
             <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
                <Send size={20} />
             </button>
          </form>
      )}
    </div>
  );
};