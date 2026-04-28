import { Client, Professional, Appointment, Transaction, InventoryItem, Product, Drink, Reward } from '../types';

export interface MappingConfig {
  clients: Record<string, string>;
  professionals: Record<string, string>;
  appointments: Record<string, string>;
  transactions: Record<string, string>;
  inventory: Record<string, string>;
  products: Record<string, string>;
  drinks: Record<string, string>;
  rewards: Record<string, string>;
}

export class SmartRestoreService {
  constructor() {}

  private parseCompactFormat(data: string): any {
    const lines = data.split('\n');
    const compactData: Record<string, any[]> = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const match = trimmed.match(/^([a-zA-Z]{3}):\s*(.*)$/);
      if (match) {
        const key = match[1].toUpperCase();
        try {
          compactData[key] = JSON.parse(match[2]);
        } catch (e) {
          console.warn(`Erro ao parsear linha compacta ${key}:`, e);
        }
      }
    });

    return {
      clients: (compactData.CLI || []).map((c: any) => ({ 
        id: c[0], name: c[1], phone: c[2], points: c[3], totalSpent: c[4] 
      })),
      professionals: (compactData.PRO || []).map((p: any) => ({ 
        id: p[0], name: p[1], role: p[2] 
      })),
      appointments: (compactData.AGE || []).map((a: any) => ({ 
        id: a[0], clientId: a[1], professionalId: a[2], date: a[3], time: a[4], 
        status: a[5] === 'inadimplente' ? 'Falta' : a[5], value: a[6] 
      })),
      transactions: (compactData.FIN || []).map((f: any) => ({ 
        id: f[0], type: f[1] === 'entrada' ? 'income' : 'expense', 
        amount: f[2], date: f[3], description: f[4] 
      })),
      inventory: (compactData.INV || []).map((i: any) => ({ 
        id: i[0], name: i[1], stock: i[2], price: i[3] 
      }))
    };
  }

  private parseJsonWithLegacyFixes(data: string): any {
    // Remove BOM and trim whitespace
    let dataToProcess = data.replace(/^\uFEFF/, '').trim();
    if (dataToProcess.endsWith(',')) dataToProcess = dataToProcess.slice(0, -1);
    
    try {
      return JSON.parse(dataToProcess);
    } catch (e: any) {
      if (dataToProcess.length < 50000000) {
        let needsFix = false;
        let fixedData = dataToProcess;
        
        if (fixedData.includes('nulo')) { fixedData = fixedData.replace(/nulo/g, 'null'); needsFix = true; }
        if (fixedData.includes('verdadeiro')) { fixedData = fixedData.replace(/verdadeiro/g, 'true'); needsFix = true; }
        if (fixedData.includes('falso')) { fixedData = fixedData.replace(/falso/g, 'false'); needsFix = true; }
        
        try {
          return JSON.parse(fixedData);
        } catch (e2) {
          // Se ainda falhar, tenta um parse mais leniente (lida com aspas simples, chaves sem aspas, vírgulas sobrando)
          try {
            const lenientParse = new Function(`return (${fixedData});`);
            return lenientParse();
          } catch (e3) {
            // Tenta extrair um JSON do meio do texto
            const jsonMatch = fixedData.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0]);
              } catch (e4) {
                // Ignora e lança o erro original
              }
            }
            throw new Error(`O arquivo não é um JSON válido. Detalhe: ${e.message}`);
          }
        }
      }
      throw new Error(`Formato de arquivo inválido. Certifique-se de que é um JSON válido ou um arquivo de texto no formato de backup do sistema. Detalhe: ${e.message}`);
    }
  }

  async analyzeBackup(data: string): Promise<{ mapping: MappingConfig, transformedData: any }> {
    console.log('Starting heuristic backup analysis...');
    
    // Parse the data
    let parsedData: any;
    const isCompactFormat = /CLI:\s*\[/i.test(data) || /PRO:\s*\[/i.test(data) || /AGE:\s*\[/i.test(data);
    
    if (isCompactFormat) {
      console.log('Compact text format detected in Smart Analysis');
      parsedData = this.parseCompactFormat(data);
    } else {
      parsedData = this.parseJsonWithLegacyFixes(data);
    }

    const mapping: MappingConfig = {
      clients: {},
      professionals: {},
      appointments: {},
      transactions: {},
      inventory: {},
      products: {},
      drinks: {},
      rewards: {}
    };

    const transformedData: any = {
      clients: [],
      professionals: [],
      appointments: [],
      transactions: [],
      inventory: [],
      products: [],
      drinks: [],
      rewards: []
    };

    // Heuristics to find collections
    const collections = this.identifyCollections(parsedData);

    // Map Clients
    if (collections.clients) {
      const sample = collections.clients[0] || {};
      mapping.clients = this.mapFields(sample, ['id', 'name', 'nome', 'email', 'phone', 'telefone', 'celular', 'cpf', 'status', 'points', 'pontos']);
      transformedData.clients = collections.clients.slice(0, 5).map((item: any) => this.applyMapping(item, mapping.clients));
    }

    // Map Professionals
    if (collections.professionals) {
      const sample = collections.professionals[0] || {};
      mapping.professionals = this.mapFields(sample, ['id', 'name', 'nome', 'role', 'cargo', 'specialty', 'especialidade', 'status']);
      transformedData.professionals = collections.professionals.slice(0, 5).map((item: any) => this.applyMapping(item, mapping.professionals));
    }

    // Map Appointments
    if (collections.appointments) {
      const sample = collections.appointments[0] || {};
      mapping.appointments = this.mapFields(sample, ['id', 'clientId', 'cliente_id', 'professionalId', 'profissional_id', 'service', 'servico', 'date', 'data', 'time', 'hora', 'status', 'value', 'valor']);
      transformedData.appointments = collections.appointments.slice(0, 5).map((item: any) => this.applyMapping(item, mapping.appointments));
    }
    
    // Map Transactions
    if (collections.transactions) {
      const sample = collections.transactions[0] || {};
      mapping.transactions = this.mapFields(sample, ['id', 'type', 'tipo', 'amount', 'valor', 'date', 'data', 'description', 'descricao', 'method', 'metodo', 'category', 'categoria']);
      transformedData.transactions = collections.transactions.slice(0, 5).map((item: any) => this.applyMapping(item, mapping.transactions));
    }

    return { mapping, transformedData };
  }

  async transformFullData(data: string, mapping: MappingConfig, onProgress?: (progress: number) => void): Promise<any> {
    let parsedData: any;
    const isCompactFormat = /CLI:\s*\[/i.test(data) || /PRO:\s*\[/i.test(data) || /AGE:\s*\[/i.test(data);

    if (isCompactFormat) {
      parsedData = this.parseCompactFormat(data);
    } else {
      parsedData = this.parseJsonWithLegacyFixes(data);
    }

    const collections = this.identifyCollections(parsedData);
    const transformedData: any = {
      clients: [],
      professionals: [],
      appointments: [],
      transactions: [],
      inventory: [],
      products: [],
      drinks: [],
      rewards: []
    };

    if (onProgress) onProgress(10);

    if (collections.clients) {
      transformedData.clients = collections.clients.map((item: any) => this.applyMapping(item, mapping.clients));
    }
    if (onProgress) onProgress(30);

    if (collections.professionals) {
      transformedData.professionals = collections.professionals.map((item: any) => this.applyMapping(item, mapping.professionals));
    }
    if (onProgress) onProgress(50);

    if (collections.appointments) {
      transformedData.appointments = collections.appointments.map((item: any) => this.applyMapping(item, mapping.appointments));
    }
    if (onProgress) onProgress(70);
    
    if (collections.transactions) {
      transformedData.transactions = collections.transactions.map((item: any) => this.applyMapping(item, mapping.transactions));
    }
    if (onProgress) onProgress(90);

    // Add default values and clean up
    transformedData.clients = transformedData.clients.map((c: any) => ({
      ...c,
      id: c.id || Math.random().toString(36).substr(2, 9),
      name: c.name || c.nome || 'Sem Nome',
      email: c.email || '',
      phone: c.phone || c.telefone || c.celular || '',
      status: ['Ativo', 'Inadimplente', 'Inativo'].includes(c.status) ? c.status : 'Ativo',
      points: Number(c.points || c.pontos || 0),
      totalSpent: Number(c.totalSpent || c.total_spent || 0),
      level: ['Bronze', 'Prata', 'Ouro', 'Viking'].includes(c.level) ? c.level : 'Bronze'
    }));

    transformedData.professionals = transformedData.professionals.map((p: any) => ({
      ...p,
      id: p.id || Math.random().toString(36).substr(2, 9),
      name: p.name || p.nome || 'Sem Nome',
      role: p.role || p.cargo || 'Profissional',
      specialty: Array.isArray(p.specialty) ? p.specialty : (p.specialty ? [p.specialty] : ['Geral']),
      rating: Number(p.rating || 5),
      status: ['Disponível', 'Em Atendimento', 'Ausente'].includes(p.status) ? p.status : 'Disponível',
      commission: Number(p.commission || p.comissao || 0)
    }));

    transformedData.appointments = transformedData.appointments.map((a: any) => ({
      ...a,
      id: a.id || Math.random().toString(36).substr(2, 9),
      clientId: a.clientId || a.cliente_id || '',
      clientName: a.clientName || a.cliente_nome || 'Cliente',
      professionalId: a.professionalId || a.profissional_id || '',
      professionalName: a.professionalName || a.profissional_nome || 'Profissional',
      service: a.service || a.servico || 'Serviço',
      date: a.date || a.data || new Date().toISOString().split('T')[0],
      time: String(a.time || a.hora || '00:00').substring(0, 5),
      status: ['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'].includes(a.status) ? a.status : 'Confirmado',
      value: Number(a.value || a.valor || 0),
      duration: Number(a.duration || a.duracao || 60)
    }));
    
    transformedData.transactions = transformedData.transactions.map((t: any) => ({
      ...t,
      id: t.id || Math.random().toString(36).substr(2, 9),
      type: ['income', 'expense'].includes(t.type) ? t.type : (t.tipo === 'receita' ? 'income' : 'expense'),
      amount: Number(t.amount || t.valor || 0),
      date: t.date || t.data || new Date().toISOString().split('T')[0],
      description: t.description || t.descricao || 'Transação',
      method: t.method || t.metodo || 'Dinheiro',
      category: t.category || t.categoria || 'Outros',
      status: ['completed', 'pending', 'cancelled'].includes(t.status) ? t.status : 'completed'
    }));

    if (onProgress) onProgress(100);
    return transformedData;
  }

  private identifyCollections(data: any): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    
    // If data is an array, try to guess what it is based on the first item
    if (Array.isArray(data)) {
      if (data.length === 0) return result;
      const sample = data[0];
      if (sample.name && (sample.phone || sample.email || sample.cpf)) {
        result.clients = data;
      } else if (sample.name && (sample.role || sample.specialty)) {
        result.professionals = data;
      } else if (sample.clientId || sample.professionalId || sample.service || sample.date) {
        result.appointments = data;
      } else if (sample.amount || sample.valor || sample.type || sample.tipo) {
        result.transactions = data;
      }
      return result;
    }

    // If data is an object, look for keys that might be collections
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('client') || lowerKey.includes('user') || lowerKey.includes('customer')) {
          result.clients = value;
        } else if (lowerKey.includes('prof') || lowerKey.includes('barber') || lowerKey.includes('employee')) {
          result.professionals = value;
        } else if (lowerKey.includes('appoint') || lowerKey.includes('schedul') || lowerKey.includes('agend')) {
          result.appointments = value;
        } else if (lowerKey.includes('trans') || lowerKey.includes('payment') || lowerKey.includes('pagament') || lowerKey.includes('financ')) {
          result.transactions = value;
        } else if (lowerKey.includes('prod') || lowerKey.includes('item')) {
          result.products = value;
        } else if (lowerKey.includes('invent') || lowerKey.includes('estoq')) {
          result.inventory = value;
        }
      }
    }

    return result;
  }

  private mapFields(sample: any, targetFields: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const sampleKeys = Object.keys(sample);

    for (const target of targetFields) {
      // Exact match
      if (sampleKeys.includes(target)) {
        mapping[target] = target;
        continue;
      }

      // Case-insensitive match
      const lowerTarget = target.toLowerCase();
      const match = sampleKeys.find(k => k.toLowerCase() === lowerTarget);
      if (match) {
        mapping[target] = match;
        continue;
      }

      // Partial match (e.g., 'client_name' for 'name')
      const partialMatch = sampleKeys.find(k => k.toLowerCase().includes(lowerTarget) || lowerTarget.includes(k.toLowerCase()));
      if (partialMatch) {
        mapping[target] = partialMatch;
      }
    }

    return mapping;
  }

  private applyMapping(item: any, mapping: Record<string, string>): any {
    const result: any = {};
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      result[targetKey] = item[sourceKey];
    }
    // Keep unmapped fields just in case
    for (const [key, value] of Object.entries(item)) {
      if (!Object.values(mapping).includes(key)) {
        result[key] = value;
      }
    }
    return result;
  }
}
