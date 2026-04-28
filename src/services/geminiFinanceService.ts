import { GoogleGenAI, Type } from "@google/genai";
import { ManagementTransaction } from "../types";

// Helper to safely get the API key in Vite environment
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function analyzeFinancialDocument(
  fileData: string, 
  mimeType: string,
  categories: string[]
): Promise<Partial<ManagementTransaction>[]> {
  const prompt = `
    Você é um assistente financeiro especialista em análise de dados.
    Analise o documento financeiro fornecido e extraia os lançamentos.
    
    REGRAS CRÍTICAS E OBRIGATÓRIAS (O NÃO CUMPRIMENTO GERARÁ ERRO):
    
    1. DESCRIÇÃO (NOME DO ESTABELECIMENTO/PESSOA):
       - EXTRAIA APENAS O NOME DO LOCAL OU PESSOA.
       - É ESTRITAMENTE PROIBIDO incluir na descrição:
         * Números de identificação (ex: 46167592592)
         * Horários (ex: 18:33:33)
         * A palavra "Cartão", "CartÃ£o", "Pix", "Boleto", "TED", "DOC"
         * Nomes de contas/detalhes como "vikingstudio", "Jeyjey", "Enviado", "Pagamento efetuado"
         * Valores financeiros (ex: -78 77, R$ 50)
       - EXEMPLOS DE LIMPEZA OBRIGATÓRIA:
         * "46167592592 18:33:33 CartÃ£o COMERCIAL DE ALIMENTOS vikingstudio -78 77" -> "COMERCIAL DE ALIMENTOS"
         * "2026-04-14,18:33:33,Cartão,AMERICANAS SA,Jeyjey,-R$ 26,89" -> "AMERICANAS SA"
         * "Pix JEYNNE ACRIZIO DAS MERCES" -> "JEYNNE ACRIZIO DAS MERCES"
         * "IOF do Empréstimo Inteligente" -> "IOF do Empréstimo Inteligente"
         * "Uber UBER * PENDING" -> "Uber"
         * "DL*UberRides" -> "Uber"
         * "IFD*IFOOD CLUB" -> "iFood"
         * "99Food *Burger King -" -> "Burger King"
       - CORRIJA ACENTUAÇÃO QUEBRADA: "CartÃ£o" vira "Cartão", "EmprÃ©stimo" vira "Empréstimo", "AÃ§Ã£o" vira "Ação", "SÃ£o" vira "São", "OperaÃ§Ãµes" vira "Operações".

    2. VALOR:
       - Extraia o valor real da transação.
       - Se for CSV, pegue a última coluna (ex: "-R$ 78,77" -> 78.77).
       - Se for texto bagunçado, pegue os últimos números antes do final da linha (ex: "-78 77" -> 78.77).
       - O valor DEVE ser um número positivo (float). Ex: 78.77.
       
    3. TIPO:
       - 'Entrada' ou 'Saída'. Valores negativos ou pagamentos são 'Saída'.
       
    4. DATA:
       - Formato YYYY-MM-DD.
       
    5. CATEGORIA:
       - Escolha a mais adequada entre: ${categories.join(', ')}.
       
    6. ORIGEM:
       - 'Trabalho': estúdio, tatuagem, piercing, materiais, aluguel comercial.
       - 'Casa': gastos pessoais, alimentação, lazer, moradia.
       
    7. FORMA DE PAGAMENTO:
       - 'Pix', 'Dinheiro', 'Cartão' ou 'Outro'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: fileData, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "APENAS o nome limpo do estabelecimento ou pessoa. SEM datas, SEM horários, SEM a palavra 'Cartão' ou 'Pix', SEM valores." },
              value: { type: Type.NUMBER, description: "Valor numérico positivo da transação." },
              type: { type: Type.STRING, enum: ['Entrada', 'Saída'] },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              origin: { type: Type.STRING, enum: ['Casa', 'Trabalho'] },
              method: { type: Type.STRING, enum: ['Pix', 'Dinheiro', 'Cartão', 'Outro'] },
              isRecurring: { type: Type.BOOLEAN },
              syncWithMain: { type: Type.BOOLEAN }
            },
            required: ['description', 'value', 'type', 'date', 'category', 'origin', 'method']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Erro ao analisar documento com Gemini:", e);
    throw e;
  }
}

export async function analyzeFinancialText(
  text: string,
  categories: string[]
): Promise<Partial<ManagementTransaction>[]> {
  const prompt = `
    Você é um assistente financeiro de elite, especialista em análise de dados e categorização inteligente.
    Sua missão é analisar o seguinte texto extraído de uma planilha ou extrato financeiro e identificar todos os lançamentos de entrada e saída, limpando os nomes e categorizando com precisão.
    
    Texto:
    ${text}
    
    REGRAS CRÍTICAS E OBRIGATÓRIAS (O NÃO CUMPRIMENTO GERARÁ ERRO):
    
    1. DESCRIÇÃO (NOME DO ESTABELECIMENTO/PESSOA):
       - EXTRAIA APENAS O NOME DO LOCAL OU PESSOA. SEJA EXTREMAMENTE MINIMALISTA.
       - É ESTRITAMENTE PROIBIDO incluir na descrição:
         * Números de identificação, códigos de transação, NSU, autenticação (ex: 46167592592, 000000000)
         * Horários, datas, ou qualquer formato temporal (ex: 18:33:33, 14/04)
         * Palavras genéricas de método de pagamento: "Cartão", "CartÃ£o", "Pix", "Boleto", "TED", "DOC", "Compra", "Pagamento", "Transferência", "Transf", "Recebimento", "Enviado", "Efetuado", "Debito", "Credito"
         * Nomes de contas, detalhes de aplicativo ou sufixos inúteis como "vikingstudio", "Jeyjey", "PENDING", "CLUB", "BR", "SA", "LTDA", "ME", "Pag*"
         * Valores financeiros (ex: -78 77, R$ 50)
         * Caracteres especiais soltos ou pontuações no início/fim (ex: "*", "-", "/")
       - EXEMPLOS DE LIMPEZA OBRIGATÓRIA:
         * "46167592592 18:33:33 CartÃ£o COMERCIAL DE ALIMENTOS vikingstudio -78 77" -> "Comercial de Alimentos"
         * "2026-04-14,18:33:33,Cartão,AMERICANAS SA,Jeyjey,-R$ 26,89" -> "Americanas"
         * "Pix JEYNNE ACRIZIO DAS MERCES" -> "Jeynne Acrizio"
         * "IOF do Empréstimo Inteligente" -> "IOF Empréstimo"
         * "Uber UBER * PENDING" -> "Uber"
         * "DL*UberRides" -> "Uber"
         * "IFD*IFOOD CLUB" -> "iFood"
         * "99Food *Burger King -" -> "Burger King"
         * "Pag*MercadoLivre" -> "Mercado Livre"
         * "Amazon Prime Video BR" -> "Amazon Prime"
         * "PGTO BOLETO - ENERGIA ELETRICA" -> "Energia Elétrica"
       - Formate o nome em Title Case (Primeira Letra Maiúscula), exceto marcas conhecidas (ex: iFood, Uber).
       - CORRIJA ACENTUAÇÃO QUEBRADA: "CartÃ£o" vira "Cartão", "EmprÃ©stimo" vira "Empréstimo", "AÃ§Ã£o" vira "Ação", "SÃ£o" vira "São", "OperaÃ§Ãµes" vira "Operações".

    2. VALOR:
       - Extraia o valor real da transação.
       - Se for CSV, pegue a última coluna (ex: "-R$ 78,77" -> 78.77).
       - Se for texto bagunçado, pegue os últimos números antes do final da linha (ex: "-78 77" -> 78.77).
       - O valor DEVE ser um número positivo (float). Ex: 78.77.
       
    3. TIPO:
       - 'Entrada' ou 'Saída'. Valores negativos ou pagamentos são 'Saída'.
       
    4. DATA:
       - Formato YYYY-MM-DD.
       
    5. CATEGORIA (SEJA INTELIGENTE E DEDUZIDO):
       - Escolha a mais adequada entre: ${categories.join(', ')}.
       - Use lógica humana para deduzir:
         * iFood, Burger King, McDonald's, Padaria, Supermercado, Alimentos -> "Alimentação"
         * Uber, 99, Posto, Gasolina, Passagem -> "Transporte"
         * Netflix, Spotify, Amazon Prime, Cinema -> "Lazer" ou "Assinaturas"
         * Farmácia, Droga Raia, Hospital -> "Saúde"
         * Energia, Água, Internet, Vivo, Claro -> "Contas" ou "Serviços"
         * Se não souber, use "Outros".
       
    6. ORIGEM:
       - 'Trabalho': estúdio, tatuagem, piercing, materiais, aluguel comercial, fornecedores.
       - 'Casa': gastos pessoais, alimentação, lazer, moradia, supermercado, farmácia.
       - Use o bom senso: compras de supermercado geralmente são "Casa". Compra de agulhas é "Trabalho".
       
    7. FORMA DE PAGAMENTO:
       - Deduza pelo texto: se tiver "Pix", é 'Pix'. Se tiver "Cartão", "Mastercard", "Visa", é 'Cartão'. Senão, 'Outro'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "APENAS o nome limpo do estabelecimento ou pessoa em Title Case. SEM lixo, SEM códigos." },
              value: { type: Type.NUMBER, description: "Valor numérico positivo da transação." },
              type: { type: Type.STRING, enum: ['Entrada', 'Saída'] },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              origin: { type: Type.STRING, enum: ['Casa', 'Trabalho'] },
              method: { type: Type.STRING, enum: ['Pix', 'Dinheiro', 'Cartão', 'Outro'] },
              isRecurring: { type: Type.BOOLEAN },
              syncWithMain: { type: Type.BOOLEAN }
            },
            required: ['description', 'value', 'type', 'date', 'category', 'origin', 'method']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Erro ao analisar texto com Gemini:", e);
    throw e;
  }
}
