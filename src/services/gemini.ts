
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o Assistente Virtual Inteligente da PetSpa, um petshop premium.
Seu objetivo é ser útil, amigável e usar emojis moderadamente 🐶.

Contexto da Loja:
- Serviços: Banho (R$ 50), Tosa (R$ 80), Hidratação (R$ 60), Corte de Unhas (R$ 20).
- Horário: Seg-Sex 09h às 18h, Sáb 09h às 14h.
- Localização: Centro da Cidade.

Regras de Resposta:
1. Responda dúvidas sobre cuidados com pets (cães e gatos).
2. Se o usuário perguntar preços, use a tabela acima.
3. Se o usuário quiser AGENDAR um serviço, explique gentilmente que ele deve clicar na opção "📅 Agendar Banho" no menu ou digitar "menu" para ver as opções. Você NÃO pode agendar diretamente, apenas o sistema de botões pode.
4. Respostas curtas e diretas (máximo 2 parágrafos).
`;

// Inicialização com a chave injetada via define do vite
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async sendMessage(history: { role: 'user' | 'model', parts: [{ text: string }] }[], message: string) {
    try {
      const model = 'gemini-2.5-flash';
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
        history: history
      });
      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Erro ao chamar Gemini:", error);
      return "Desculpe, meu cérebro de IA está um pouco confuso agora 🤯. Tente novamente mais tarde.";
    }
  },

  async generateMascotPhrase(userName: string, petNames: string[] = []) {
    try {
      const model = 'gemini-2.5-flash';
      const petsContext = petNames.length > 0 
        ? `O usuário tem os pets: ${petNames.join(', ')}.` 
        : 'O usuário ainda não cadastrou pets.';

      const prompt = `
        Crie uma frase CURTA (máximo 10 palavras), criativa e fofa como se fosse um mascote de cachorro falando.
        Objetivo: Convencer o usuário (${userName}) a agendar um banho ou comprar um brinquedo.
        Contexto: ${petsContext}
        Use 1 emoji. Não use aspas.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text.trim();
    } catch (error) {
      return "Vamos deixar seu pet feliz hoje? 🐾"; // Fallback
    }
  }
};
