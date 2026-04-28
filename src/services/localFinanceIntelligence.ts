import { ManagementTransaction, ManagementCategory } from '../types';

// Initial knowledge base for the local intelligence
const KEYWORD_MAP: Record<string, { category: string; origin: 'Casa' | 'Trabalho'; type: 'Entrada' | 'Saída' }> = {
  'UBER': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  '99APP': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'IFOOD': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'RAPPI': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'MERCADO': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'SUPERMERCADO': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'CARREFOUR': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'ATACADAO': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'POSTO': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'SHELL': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'IPIRANGA': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'NETFLIX': { category: 'Lazer', origin: 'Casa', type: 'Saída' },
  'SPOTIFY': { category: 'Lazer', origin: 'Casa', type: 'Saída' },
  'AMAZON': { category: 'Outros', origin: 'Casa', type: 'Saída' },
  'TATTOO': { category: 'Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'CLIENTE': { category: 'Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'PIX RECEBIDO': { category: 'Entrada Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'MATERIAL': { category: 'Trabalho', origin: 'Trabalho', type: 'Saída' },
  'TINTA': { category: 'Trabalho', origin: 'Trabalho', type: 'Saída' },
  'AGULHA': { category: 'Trabalho', origin: 'Trabalho', type: 'Saída' },
  'ALUGUEL': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'CONDOMINIO': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'LUZ': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'ENERGIA': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'AGUA': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'INTERNET': { category: 'Moradia', origin: 'Casa', type: 'Saída' },
  'FARMACIA': { category: 'Saúde', origin: 'Casa', type: 'Saída' },
  'DROGASIL': { category: 'Saúde', origin: 'Casa', type: 'Saída' },
  'HOSPITAL': { category: 'Saúde', origin: 'Casa', type: 'Saída' },
  'PAGSEGURO': { category: 'Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'SUMUP': { category: 'Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'STONE': { category: 'Trabalho', origin: 'Trabalho', type: 'Entrada' },
  'MERCADO PAGO': { category: 'Outros', origin: 'Casa', type: 'Saída' },
  'ESTACIONAMENTO': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'PEDAGIO': { category: 'Transporte', origin: 'Casa', type: 'Saída' },
  'CONVENIENCIA': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'RESTAURANTE': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'PADARIA': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
  'LANCHONETE': { category: 'Alimentação', origin: 'Casa', type: 'Saída' },
};

/**
 * Local Intelligence Service
 * Processes data locally without external API calls
 */
export const LocalFinanceIntelligence = {
  /**
   * Classifies a description based on keywords and learned patterns
   */
  classify(description: string, userRules: any[] = []): { category: string; origin: 'Casa' | 'Trabalho'; type: 'Entrada' | 'Saída' } {
    const upperDesc = description.toUpperCase();
    
    // 1. Check user-defined rules first (Learning)
    for (const rule of userRules) {
      if (upperDesc.includes(rule.keyword.toUpperCase())) {
        return { category: rule.category, origin: rule.origin, type: rule.type };
      }
    }

    // 2. Check built-in keyword map
    for (const [keyword, data] of Object.entries(KEYWORD_MAP)) {
      if (upperDesc.includes(keyword)) {
        return data;
      }
    }

    // 3. Default heuristics
    if (upperDesc.includes('PIX') && (upperDesc.includes('RECEBIDO') || upperDesc.includes('TRANSFERENCIA DE'))) {
      return { category: 'Entrada Trabalho', origin: 'Trabalho', type: 'Entrada' };
    }

    return { category: 'Outros', origin: 'Casa', type: 'Saída' };
  },

  /**
   * Parses a string (from CSV/XLSX) and extracts transactions
   */
  parseText(text: string, userRules: any[] = []): Partial<ManagementTransaction>[] {
    const lines = text.split('\n');
    const transactions: Partial<ManagementTransaction>[] = [];
    
    // Regex patterns for common financial formats
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})|(\d{2}\/\d{2}\/\d{2})|(\d{4}-\d{2}-\d{2})/;
    // Improved value regex: handle Brazilian thousand separators (1.234,56), simple decimals, and currency symbols
    const valueRegex = /(-?\(?\d{1,3}(\.\d{3})*(,\d{1,2})?\)?)|(-?\d+[\.,]\d{1,2})|(-?\d+)/g;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 3) return;

      // Skip common header keywords
      const upperLine = trimmedLine.toUpperCase();
      if (upperLine.includes('SALDO') || upperLine.includes('EXTRATO') || (upperLine.includes('DATA') && upperLine.includes('VALOR'))) {
        return;
      }

      const dateMatch = trimmedLine.match(dateRegex);
      let dateStr = dateMatch ? dateMatch[0] : null;
      
      // Remove date and currency symbols from line to avoid matching them as values
      let lineForValueMatch = trimmedLine.replace(/R\$\s?/g, '').replace(/\$/g, '');
      if (dateStr) {
        lineForValueMatch = lineForValueMatch.replace(dateStr, ' ');
      }

      // Find all potential values
      const valueMatches = lineForValueMatch.match(valueRegex);
      if (valueMatches && valueMatches.length > 0) {
        // Filter out values that are likely just years or small IDs if we already have a date
        const filteredMatches = valueMatches.filter(m => {
          const v = m.replace(/[().,]/g, '');
          if (dateStr && (v === '2024' || v === '2025' || v === '2026')) return false;
          return true;
        });

        if (filteredMatches.length === 0) return;

        // Pick the best value match (usually the one with decimals or the last one)
        let bestValueMatch = filteredMatches[filteredMatches.length - 1];
        const decimalMatch = filteredMatches.find(m => m.includes(',') || m.includes('.'));
        if (decimalMatch) bestValueMatch = decimalMatch;

        let cleanValue = bestValueMatch.replace(/[()]/g, ''); // Remove parentheses
        const isNegative = bestValueMatch.startsWith('-') || 
                          bestValueMatch.startsWith('(') ||
                          upperLine.includes('DÉBITO') || 
                          upperLine.includes('SAÍDA') ||
                          upperLine.includes('PAGAMENTO') ||
                          upperLine.includes('DESPESA');
        
        if (cleanValue.includes(',') && cleanValue.includes('.')) {
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        } else if (cleanValue.includes(',')) {
          cleanValue = cleanValue.replace(',', '.');
        } else if (cleanValue.includes('.')) {
          const parts = cleanValue.split('.');
          if (parts[parts.length - 1].length === 3 && parts.length > 1) {
            cleanValue = cleanValue.replace(/\./g, '');
          }
        }

        let value = Math.abs(parseFloat(cleanValue));
        if (isNaN(value)) return;

        // Clean description: remove date and value from line
        let description = trimmedLine
          .replace(dateStr || '', '')
          .replace(bestValueMatch, '')
          .replace(/R\$\s?/g, '')
          .replace(/[|;,\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!description || description.length < 2) description = 'Transação sem descrição';

        const classification = this.classify(description, userRules);
        const type = isNegative ? 'Saída' : (upperLine.includes('CRÉDITO') || upperLine.includes('ENTRADA') || upperLine.includes('RECEBIDO') ? 'Entrada' : classification.type);

        transactions.push({
          description,
          value,
          type,
          date: dateStr ? this.normalizeDate(dateStr) : new Date().toISOString().split('T')[0],
          category: classification.category,
          origin: classification.origin,
          method: this.detectMethod(trimmedLine),
          isRecurring: false,
          syncWithMain: false
        });
      }
    });

    return transactions;
  },

  /**
   * Detects payment method from text
   */
  detectMethod(text: string): 'Pix' | 'Dinheiro' | 'Cartão' | 'Outro' {
    const upper = text.toUpperCase();
    if (upper.includes('PIX')) return 'Pix';
    if (upper.includes('CARTAO') || upper.includes('VISA') || upper.includes('MASTER') || upper.includes('ELO')) return 'Cartão';
    if (upper.includes('DINHEIRO') || upper.includes('ESPECIE')) return 'Dinheiro';
    return 'Outro';
  },

  /**
   * Normalizes various date formats to YYYY-MM-DD
   */
  normalizeDate(dateStr: string): string {
    if (dateStr.includes('-')) return dateStr; // Already YYYY-MM-DD
    
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let day = parts[0];
      let month = parts[1];
      let year = parts[2];
      
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
  }
};
