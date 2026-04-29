import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Client, Professional, Appointment, Transaction, InventoryItem, Product, Drink, Reward } from '../types';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  Database,
  Wand2,
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  Trash2,
  Zap,
  Download,
  Settings2,
  Play
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, toSnakeCase } from '../lib/utils';
import { SmartRestoreService, MappingConfig } from '../services/smartRestoreService';

export default function ImportLegacy() {
  const { clients, professionals, appointments, setClients, setProfessionals, setAppointments, setTransactions, setInventory, setProducts, setDrinks, setRewards } = useData();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileContentRef = useRef<string | null>(null);
  const [mappingConfig, setMappingConfig] = useState<MappingConfig | null>(null);
  const [aiResult, setAiResult] = useState<{
    clients: Client[];
    professionals: Professional[];
    appointments: Appointment[];
    transactions: Transaction[];
    inventory: InventoryItem[];
    products: Product[];
    drinks: Drink[];
    rewards: Reward[];
  } | null>(null);
  const [fileSummary, setFileSummary] = useState<{
    clients: number;
    professionals: number;
    appointments: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('ImportLegacy: fileName state changed to:', fileName);
  }, [fileName]);

  console.log('ImportLegacy: Rendering component. fileName:', fileName, 'loading:', loading, 'aiLoading:', aiLoading);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered');
    try {
      const file = e.target.files?.[0];
      if (!file || !file.name) {
        console.log('No valid file selected');
        return;
      }
      
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown'
      });

      selectedFileRef.current = file;
      setFileName(file.name);
      setError(null);
      setSuccess(null);
      setFileSummary(null); // Clear any previous summary
      
      // If inputText is empty or just the placeholder, update it to show something is happening
      if (!inputText || inputText === 'FILE_SELECTED') {
        setInputText('FILE_SELECTED');
      }
      
      console.log('State updated successfully in handleFileChange');
    } catch (err) {
      console.error('Error in handleFileChange:', err);
      setError('Erro ao selecionar o arquivo.');
    }
  };

  const clearFile = () => {
    console.log('clearFile triggered');
    selectedFileRef.current = null;
    setFileName(null);
    fileContentRef.current = null;
    setFileSummary(null);
    setInputText('');
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const [progress, setProgress] = useState<{ current: number; total: number; stage: string } | null>(null);

  const normalizeDate = (dateVal: any): string => {
    const today = new Date().toISOString().split('T')[0];
    if (!dateVal) return today;
    try {
      let dStr = String(dateVal).trim();
      // Handle DD/MM/YYYY or DD-MM-YYYY
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dStr)) {
        const parts = dStr.split(/[\/\-]/);
        dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return today;
      return d.toISOString().split('T')[0];
    } catch (e) {
      return today;
    }
  };

  const handleSmartImport = async () => {
    console.log('Starting Smart Analysis...');
    setAiLoading(true);
    setError(null);
    setSuccess(null);
    setMappingConfig(null);
    setAiResult(null);
    setProgress({ current: 0, total: 100, stage: 'Analisando estrutura dos dados...' });

    try {
      let dataToProcess = '';

      if (fileContentRef.current) {
        dataToProcess = fileContentRef.current;
      } else if (selectedFileRef.current) {
        console.log('Reading file for analysis...', selectedFileRef.current.name, selectedFileRef.current.size);
        // Ler o arquivo inteiro para não quebrar a estrutura do JSON
        dataToProcess = await selectedFileRef.current.text();
        console.log('File read successfully, length:', dataToProcess.length);
      } else {
        dataToProcess = inputText.trim();
      }

      if (!dataToProcess || dataToProcess === 'FILE_SELECTED') {
        throw new Error('Nenhum dado para importar. Selecione um arquivo ou cole o texto.');
      }

      const smartService = new SmartRestoreService();
      console.log('Calling Smart Service for analysis...');
      
      const result = await smartService.analyzeBackup(dataToProcess);
      console.log('Smart Analysis complete');

      setMappingConfig(result.mapping);
      setAiResult(result.transformedData);
      
      setSuccess('Análise inteligente concluída! Revise a amostra abaixo antes de importar tudo.');
      console.log('Smart Analysis process finished successfully');
    } catch (err: any) {
      console.error('Smart Analysis error:', err);
      setError(`Erro na análise: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setAiLoading(false);
      setProgress(null);
    }
  };

  const handleFullImport = async () => {
    console.log('handleFullImport called. mappingConfig:', !!mappingConfig);
    if (!mappingConfig) {
      console.error('mappingConfig is null, returning early');
      return;
    }
    
    console.log('Starting Full Smart Import process...');
    setAiLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: 100, stage: 'Transformando todo o backup...' });

    try {
      let fullData = '';
      if (selectedFileRef.current) {
        console.log('Reading full file content from ref:', selectedFileRef.current.name);
        fullData = await selectedFileRef.current.text();
      } else {
        console.log('Reading full data from inputText');
        fullData = inputText.trim();
      }

      console.log('Full data length:', fullData.length);
      if (!fullData || fullData === 'FILE_SELECTED') {
        console.error('No data to process');
        throw new Error('Nenhum dado para processar.');
      }

      if (fullData.length > 500000) {
        console.warn('File is large, processing might take a while...');
      }
      
      const smartService = new SmartRestoreService();
      
      const transformed = await smartService.transformFullData(fullData, mappingConfig, (p) => {
        setProgress({ 
          current: Math.floor(p * 0.5), 
          total: 100, 
          stage: `Transformando dados (${p}%)...` 
        });
      });
      
      setProgress({ current: 50, total: 100, stage: 'Salvando dados no banco...' });

      const withTimeout = <T,>(promise: PromiseLike<T>, ms: number = 60000): Promise<T> => {
        const timeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`A operação demorou muito (timeout de ${ms/1000}s).`)), ms)
        );
        return Promise.race([promise, timeout]);
      };

      const saveDataInBatches = async (data: any) => {
        const BATCH_SIZE = 50;
        let totalProcessed = 0;

        // 1. Import Clients with Deduplication
        const importedClients = data.clients || [];
        const newClientsToSave: Client[] = [];
        const clientIdMapping: Record<string, string> = {}; // Maps imported ID to existing ID

        for (const importedClient of importedClients) {
          // Find existing client by phone, cpf, or email
          const existingClient = clients.find(c => {
            const samePhone = importedClient.phone && c.phone && importedClient.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
            const sameCpf = importedClient.cpf && c.cpf && importedClient.cpf.replace(/\D/g, '') === c.cpf.replace(/\D/g, '');
            const sameEmail = importedClient.email && c.email && importedClient.email.toLowerCase() === c.email.toLowerCase();
            return samePhone || sameCpf || sameEmail;
          });

          if (existingClient) {
            // Duplicate found, map the ID and skip saving
            clientIdMapping[importedClient.id] = existingClient.id;
          } else {
            // Not a duplicate, map to its own ID and add to save list
            clientIdMapping[importedClient.id] = importedClient.id;
            newClientsToSave.push(importedClient);
          }
        }

        if (newClientsToSave.length > 0) {
          for (let i = 0; i < newClientsToSave.length; i += BATCH_SIZE) {
            const batch = newClientsToSave.slice(i, i + BATCH_SIZE);
            totalProcessed += batch.length;
            setProgress({ current: 50 + Math.floor((totalProcessed / (newClientsToSave.length + (data.appointments?.length || 0))) * 50), total: 100, stage: `Salvando novos clientes: ${totalProcessed}...` });
            
            const { error } = await withTimeout(supabase.from('clients').upsert(toSnakeCase(batch)));
            if (error) throw error;
            
            setClients(prev => {
              const newState = [...prev];
              for (const item of batch) {
                const idx = newState.findIndex(x => x.id === item.id);
                if (idx >= 0) newState[idx] = item;
                else newState.push(item);
              }
              return newState;
            });
          }
        }

        // 2. Import Appointments with Deduplication and Client ID Mapping
        const importedAppointments = data.appointments || [];
        const newAppointmentsToSave: Appointment[] = [];

        for (const importedAppt of importedAppointments) {
          // Update clientId if it was mapped to an existing one
          if (importedAppt.clientId && clientIdMapping[importedAppt.clientId]) {
            importedAppt.clientId = clientIdMapping[importedAppt.clientId];
          }

          // Check for duplicate appointment
          const existingAppt = appointments.find(a => 
            a.date === importedAppt.date &&
            a.time === importedAppt.time &&
            a.professionalId === importedAppt.professionalId &&
            a.clientId === importedAppt.clientId
          );

          if (!existingAppt) {
            newAppointmentsToSave.push(importedAppt);
          }
        }

        if (newAppointmentsToSave.length > 0) {
          for (let i = 0; i < newAppointmentsToSave.length; i += BATCH_SIZE) {
            const batch = newAppointmentsToSave.slice(i, i + BATCH_SIZE);
            totalProcessed += batch.length;
            setProgress({ current: 50 + Math.floor((totalProcessed / (newClientsToSave.length + newAppointmentsToSave.length)) * 50), total: 100, stage: `Salvando novos agendamentos: ${totalProcessed}...` });
            
            const { error } = await withTimeout(supabase.from('appointments').upsert(toSnakeCase(batch)));
            if (error) throw error;
            
            setAppointments(prev => {
              const newState = [...prev];
              for (const item of batch) {
                const idx = newState.findIndex(x => x.id === item.id);
                if (idx >= 0) newState[idx] = item;
                else newState.push(item);
              }
              return newState;
            });
          }
        }

        return totalProcessed;
      };

      const total = await saveDataInBatches(transformed);

      setSuccess(`Importação completa concluída! ${total} itens foram processados e salvos.`);
      setMappingConfig(null);
      setAiResult(null);
      setInputText('');
      setFileName(null);
      selectedFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err: any) {
      console.error('Full AI Import error:', err);
      setError(`Erro na importação completa: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setAiLoading(false);
      setProgress(null);
    }
  };

  const handleImport = async () => {
    console.log('handleImport triggered');
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: 100, stage: 'Lendo arquivo...' });

    try {
      let dataToProcess = '';

      if (fileContentRef.current) {
        dataToProcess = fileContentRef.current;
      } else if (selectedFileRef.current) {
        console.log('Reading file content...', selectedFileRef.current.name);
        dataToProcess = await selectedFileRef.current.text();
        console.log('File content read, length:', dataToProcess.length);
      } else {
        dataToProcess = inputText.trim();
        console.log('Using input text, length:', dataToProcess.length);
      }

      if (!dataToProcess || (dataToProcess === 'FILE_SELECTED' && !selectedFileRef.current)) {
        throw new Error('Nenhum dado para importar. Selecione um arquivo ou cole o texto.');
      }

      // Yield to event loop to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 50));

      if (dataToProcess.endsWith(',')) dataToProcess = dataToProcess.slice(0, -1);
      
      setProgress({ current: 20, total: 100, stage: 'Parseando JSON...' });
      await new Promise(resolve => setTimeout(resolve, 50)); // Yield before heavy parse
      
      console.log('Parsing JSON data...');
      let rawData;
      
      // Detect compact format (CLI:, PRO:, AGE:, etc.)
      const isCompactFormat = /CLI:\s*\[/i.test(dataToProcess) || /PRO:\s*\[/i.test(dataToProcess) || /AGE:\s*\[/i.test(dataToProcess);
      
      if (isCompactFormat) {
        console.log('Compact backup format detected. Parsing...');
        setProgress({ current: 25, total: 100, stage: 'Processando formato compacto...' });
        const lines = dataToProcess.split('\n');
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

        rawData = {
          clients: (compactData.CLI || []).map((c: any) => ({ 
            id: c[0], nome: c[1], telefone: c[2], pontos: c[3], total_gasto: c[4] 
          })),
          professionals: (compactData.PRO || []).map((p: any) => ({ 
            id: p[0], nome: p[1], papel: p[2] 
          })),
          appointments: (compactData.AGE || []).map((a: any) => ({ 
            id: a[0], clientId: a[1], professionalId: a[2], date: a[3], time: a[4], 
            status: a[5] === 'inadimplente' ? 'Falta' : a[5], value: a[6] 
          })),
          transactions: (compactData.FIN || []).map((f: any) => ({ 
            id: f[0], tipo: f[1] === 'entrada' ? 'Receita' : 'Despesa', 
            valor: f[2], data: f[3], descricao: f[4] 
          })),
          inventory: (compactData.INV || []).map((i: any) => ({ 
            id: i[0], nome: i[1], estoque: i[2], preco: i[3] 
          }))
        };
        console.log('Compact format parsed successfully:', {
          clients: rawData.clients.length,
          pros: rawData.professionals.length,
          apps: rawData.appointments.length
        });
      } else {
        try {
          rawData = JSON.parse(dataToProcess);
        } catch (e) {
          console.log('JSON parse failed, checking for legacy formats (nulo, verdadeiro, falso)...');
          setProgress({ current: 25, total: 100, stage: 'Verificando formato legado...' });
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Only attempt to fix if the file is not excessively large (e.g., < 50MB) to prevent OOM
          if (dataToProcess.length < 50000000) {
            let needsFix = false;
            let fixedData = dataToProcess;
            
            if (fixedData.includes('nulo')) { fixedData = fixedData.replace(/\bnulo\b/g, 'null'); needsFix = true; }
            if (fixedData.includes('verdadeiro')) { fixedData = fixedData.replace(/\bverdadeiro\b/g, 'true'); needsFix = true; }
            if (fixedData.includes('falso')) { fixedData = fixedData.replace(/\bfalso\b/g, 'false'); needsFix = true; }
            
            if (needsFix) {
              console.log('Legacy format detected, attempting to parse fixed data...');
              setProgress({ current: 30, total: 100, stage: 'Corrigindo formato legado...' });
              await new Promise(resolve => setTimeout(resolve, 50));
              rawData = JSON.parse(fixedData);
            } else {
              throw e; // Re-throw if no legacy keywords found
            }
          } else {
            console.warn('File too large to attempt legacy format fix safely.');
            throw e; // Re-throw if file is too large
          }
        }
      }
      console.log('JSON parsed successfully. Identifying data arrays...');

      if (!rawData) {
        throw new Error('O arquivo está vazio ou contém um JSON inválido (null).');
      }

      let rawClients: any[] = [];
      let rawProfessionals: any[] = [];
      let rawAppointments: any[] = [];

      const identifyArray = (arr: any[]) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const first = arr[0];
        if (!first) return;
        console.log('Identifying array with fields:', Object.keys(first));
        // Use concat instead of push(...arr) to avoid RangeError: Maximum call stack size exceeded
        if (first.hora_inicio || first.time || first.servico || first.service || first.data || first.date) rawAppointments = rawAppointments.concat(arr);
        else if (first.papel || first.role || first.commission || first.nome_profissional || first.profissional) rawProfessionals = rawProfessionals.concat(arr);
        else if (first.telefone || first.phone || first.email || first.points || first.nome || first.nome_cliente || first.cliente) rawClients = rawClients.concat(arr);
      };

      if (Array.isArray(rawData)) {
        identifyArray(rawData);
      } else if (typeof rawData === 'object') {
        Object.values(rawData).forEach(val => { 
          if (Array.isArray(val)) identifyArray(val); 
        });
      }

      setProgress({ current: 40, total: 100, stage: 'Mapeando Clientes...' });
      const mappedClients: Client[] = rawClients.map((c: any) => ({
        id: c.id || Math.random().toString(36).substr(2, 9),
        name: c.nome || c.name || c.displayName || 'Sem Nome',
        email: c.email || '',
        phone: c.telefone || c.phone || c.celular || '',
        status: (['Ativo', 'Inadimplente', 'Inativo'].includes(c.status) ? c.status : 'Ativo') as any,
        points: Number(c.pontos || c.points || 0),
        totalSpent: Number(c.total_gasto || c.totalSpent || 0),
        level: (Number(c.total_gasto || c.totalSpent || 0)) > 1000 ? 'Viking' : (Number(c.total_gasto || c.totalSpent || 0)) > 500 ? 'Ouro' : (Number(c.total_gasto || c.totalSpent || 0)) > 200 ? 'Prata' : 'Bronze',
        lastVisit: normalizeDate(c.ultima_visita || c.lastVisit || c.last_visit || ''),
        birthDate: normalizeDate(c.data_nascimento || c.birthDate || c.aniversario || c.birth_date || ''),
        instagram: c.instagram || c.ig || c.insta || '',
        city: c.cidade || c.city || '',
        medicalNotes: c.notas_medicas || c.medicalNotes || c.historico_medico || c.medical_notes || '',
        indicatedBy: c.indicado_por || c.indicatedBy || c.indicated_by || '',
        isMinor: Boolean(c.menor_de_idade || c.isMinor || c.is_minor || false),
        notes: c.notas || c.notes || c.observacoes || ''
      }));

      setProgress({ current: 50, total: 100, stage: 'Mapeando Profissionais...' });
      const mappedProfessionals: Professional[] = rawProfessionals.map((p: any) => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        name: p.nome || p.name || 'Sem Nome',
        role: p.papel || p.role || 'Profissional',
        specialty: [p.tipo || p.specialty || 'Geral'],
        rating: 5,
        status: p.ativo || p.active ? 'Disponível' : 'Ausente',
        avatar: p.url_da_foto || p.avatar || '',
        commission: p.porcentagem_de_comissão || p.commission || 0,
        signature: p.assinatura || p.signature || ''
      }));

      setProgress({ current: 60, total: 100, stage: 'Mapeando Agendamentos (Otimizado)...' });
      
      // Optimization: Use Maps for O(1) lookups instead of O(N) find
      const clientMap = new Map(mappedClients.map(c => [c.id, c]));
      const proMap = new Map(mappedProfessionals.map(p => [p.id, p]));
      
      // Also include existing clients/pros for lookup
      const existingClientMap = new Map(clients.map(c => [c.id, c]));
      const existingProMap = new Map(professionals.map(p => [p.id, p]));

      const findProByName = (name: string) => {
        if (!name) return null;
        const normalized = name.toLowerCase().trim();
        const mappedMatch = mappedProfessionals.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
        if (mappedMatch) return mappedMatch;
        return professionals.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
      };

      const mappedAppointments: Appointment[] = rawAppointments.map((a: any) => {
        const clientId = a.cliente_id || a.clientId;
        const proId = a.profissional_id || a.professionalId;
        const proNameInput = a.professionalName || a.nomeProfissional || a.profissional || a.professional;
        
        const client = clientMap.get(clientId) || existingClientMap.get(clientId);
        let pro = proMap.get(proId) || existingProMap.get(proId);

        if (!pro && proNameInput) {
          pro = findProByName(proNameInput);
        }

        return {
          id: a.id || Math.random().toString(36).substr(2, 9),
          clientId,
          clientName: client?.name || a.clientName || a.nomeCliente || 'Cliente',
          professionalId: pro?.id || proId,
          professionalName: pro?.name || proNameInput || 'Profissional',
          service: a.descricao_servico || a.service || a.servico || a.descricao || 'Serviço',
          date: normalizeDate(a.dados || a.date || a.data || ''),
          time: String(a.hora_inicio || a.time || a.hora || '00:00').substring(0, 5),
          status: a.status === 'falta' ? 'Falta' : (a.status === 'concluido' ? 'Finalizado' : 'Confirmado'),
          value: Number(a.valor_total || a.value || a.valor || a.total_value || 0),
          duration: Number(a.duracao || a.duration || a.tempo || 60)
        };
      });

      const totalItems = mappedClients.length + mappedProfessionals.length + mappedAppointments.length;
      if (totalItems === 0) throw new Error('Nenhum dado reconhecido.');

      setProgress({ current: 70, total: 100, stage: 'Sincronizando com Banco de Dados...' });

      // Sanitize data before saving to state/DB
      const sanitizedClients: Client[] = mappedClients.map((c: any) => ({
        id: String(c.id || Math.random().toString(36).substr(2, 9)),
        name: String(c.name || 'Sem Nome'),
        email: String(c.email || ''),
        phone: String(c.phone || ''),
        status: (['Ativo', 'Inadimplente', 'Inativo'].includes(c.status) ? c.status : 'Ativo') as any,
        points: Number(c.points || 0),
        totalSpent: Number(c.totalSpent || 0),
        level: (['Bronze', 'Prata', 'Ouro', 'Viking'].includes(c.level) ? c.level : 'Bronze') as any
      }));

      const sanitizedPros: Professional[] = mappedProfessionals.map((p: any) => ({
        id: String(p.id || Math.random().toString(36).substr(2, 9)),
        name: String(p.name || 'Sem Nome'),
        role: String(p.role || 'Profissional'),
        specialty: Array.isArray(p.specialty) ? p.specialty.map(String) : ['Geral'],
        rating: Number(p.rating || 5),
        status: (['Disponível', 'Em Atendimento', 'Ausente'].includes(p.status) ? p.status : 'Disponível') as any,
        avatar: String(p.avatar || ''),
        commission: Number(p.commission || 0),
        signature: String(p.signature || '')
      }));

      const sanitizedApps: Appointment[] = mappedAppointments.map((a: any) => ({
        id: String(a.id || Math.random().toString(36).substr(2, 9)),
        clientId: String(a.clientId || ''),
        clientName: String(a.clientName || 'Cliente'),
        professionalId: String(a.professionalId || ''),
        professionalName: String(a.professionalName || 'Profissional'),
        service: String(a.service || 'Serviço'),
        date: String(a.date || ''),
        time: String(a.time || '00:00').substring(0, 5),
        status: (['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'].includes(a.status) ? a.status : 'Confirmado') as any,
        value: Number(a.value || 0),
        duration: Number(a.duration || 60)
      }));

      const withTimeout = <T,>(promise: PromiseLike<T>, ms: number = 60000): Promise<T> => {
        const timeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`A operação demorou muito (timeout de ${ms/1000}s).`)), ms)
        );
        return Promise.race([promise, timeout]);
      };

      const saveDataOneByOne = async (clientsToImport: Client[], prosToImport: Professional[], appsToImport: Appointment[]) => {
        const finalClients: Client[] = [];
        const finalPros: Professional[] = [];
        const finalApps: Appointment[] = [];
        const BATCH_SIZE = 50;

        // 1. Import Clients with Deduplication
        const newClientsToSave: Client[] = [];
        const clientIdMapping: Record<string, string> = {}; // Maps imported ID to existing ID

        for (const importedClient of clientsToImport) {
          // Find existing client by phone, cpf, or email
          const existingClient = clients.find(c => {
            const samePhone = importedClient.phone && c.phone && importedClient.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
            const sameCpf = importedClient.cpf && c.cpf && importedClient.cpf.replace(/\D/g, '') === c.cpf.replace(/\D/g, '');
            const sameEmail = importedClient.email && c.email && importedClient.email.toLowerCase() === c.email.toLowerCase();
            return samePhone || sameCpf || sameEmail;
          });

          if (existingClient) {
            clientIdMapping[importedClient.id] = existingClient.id;
          } else {
            clientIdMapping[importedClient.id] = importedClient.id;
            newClientsToSave.push(importedClient);
          }
        }

        if (newClientsToSave.length > 0) {
          for (let i = 0; i < newClientsToSave.length; i += BATCH_SIZE) {
            const batch = newClientsToSave.slice(i, i + BATCH_SIZE);
            setProgress({ current: Math.floor((i / newClientsToSave.length) * 33), total: 100, stage: `Salvando novos clientes ${i + 1} a ${Math.min(i + BATCH_SIZE, newClientsToSave.length)}...` });
            
            const { error } = await withTimeout(supabase.from('clients').upsert(toSnakeCase(batch)));
            if (error) throw error;
            finalClients.push(...batch);
          }
        }

        // 1.5 Import Professionals with Deduplication
        const newProsToSave: Professional[] = [];
        for (const importedPro of prosToImport) {
          const existingPro = professionals.find(p => p.name.toLowerCase() === importedPro.name.toLowerCase());
          if (!existingPro) {
            newProsToSave.push(importedPro);
          } else {
            finalPros.push(existingPro);
          }
        }

        if (newProsToSave.length > 0) {
          for (let i = 0; i < newProsToSave.length; i += BATCH_SIZE) {
            const batch = newProsToSave.slice(i, i + BATCH_SIZE);
            setProgress({ current: 33 + Math.floor((i / newProsToSave.length) * 33), total: 100, stage: `Salvando novos profissionais ${i + 1} a ${Math.min(i + BATCH_SIZE, newProsToSave.length)}...` });
            
            const snakeBatch = toSnakeCase(batch);
            const { error } = await withTimeout(supabase.from('professionals').upsert(snakeBatch));
            
            if (error) {
              if (error.message.includes("Could not find the 'assinatura' column")) {
                const safeBatch = snakeBatch.map(({ assinatura, ...rest }: any) => rest);
                const { error: retryError } = await withTimeout(supabase.from('professionals').upsert(safeBatch));
                if (retryError) throw retryError;
              } else {
                throw error;
              }
            }
            finalPros.push(...batch);
          }
        }

        // 2. Import Appointments with Deduplication and Client ID Mapping
        const newAppointmentsToSave: Appointment[] = [];

        for (const importedAppt of appsToImport) {
          // Update clientId if it was mapped to an existing one
          if (importedAppt.clientId && clientIdMapping[importedAppt.clientId]) {
            importedAppt.clientId = clientIdMapping[importedAppt.clientId];
          }

          // Check for duplicate appointment
          const existingAppt = appointments.find(a => 
            a.date === importedAppt.date &&
            a.time === importedAppt.time &&
            a.professionalId === importedAppt.professionalId &&
            a.clientId === importedAppt.clientId
          );

          if (!existingAppt) {
            newAppointmentsToSave.push(importedAppt);
          }
        }

        if (newAppointmentsToSave.length > 0) {
          for (let i = 0; i < newAppointmentsToSave.length; i += BATCH_SIZE) {
            const batch = newAppointmentsToSave.slice(i, i + BATCH_SIZE);
            setProgress({ current: 66 + Math.floor((i / newAppointmentsToSave.length) * 34), total: 100, stage: `Salvando novos agendamentos ${i + 1} a ${Math.min(i + BATCH_SIZE, newAppointmentsToSave.length)}...` });
            
            const { error } = await withTimeout(supabase.from('appointments').upsert(toSnakeCase(batch)));
            if (error) throw error;
            finalApps.push(...batch);
          }
        }

        return { finalClients, finalPros, finalApps };
      };

      const { finalClients, finalPros, finalApps } = await saveDataOneByOne(sanitizedClients, sanitizedPros, sanitizedApps);

      setClients(prev => {
        const newClients = [...prev];
        for (const c of finalClients) {
          const idx = newClients.findIndex(x => x.id === c.id);
          if (idx >= 0) newClients[idx] = c;
          else newClients.push(c);
        }
        return newClients;
      });
      setProfessionals(prev => {
        const newPros = [...prev];
        for (const p of finalPros) {
          const idx = newPros.findIndex(x => x.id === p.id);
          if (idx >= 0) newPros[idx] = p;
          else newPros.push(p);
        }
        return newPros;
      });
      setAppointments(prev => {
        const newApps = [...prev];
        for (const a of finalApps) {
          const idx = newApps.findIndex(x => x.id === a.id);
          if (idx >= 0) newApps[idx] = a;
          else newApps.push(a);
        }
        return newApps;
      });

      setSuccess(`Sucesso! Importados: ${finalClients.length} clientes, ${finalPros.length} profissionais, ${finalApps.length} agendamentos.`);
      setInputText('');
      setFileName(null);
      selectedFileRef.current = null;
      fileContentRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Import error:', err);
      setError(`Erro: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const generateSql = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: 100, stage: 'Lendo arquivo para SQL...' });

    try {
      let dataToProcess = '';

      if (fileContentRef.current) {
        dataToProcess = fileContentRef.current;
      } else if (selectedFileRef.current) {
        dataToProcess = await selectedFileRef.current.text();
      } else {
        dataToProcess = inputText.trim();
      }

      if (!dataToProcess || (dataToProcess === 'FILE_SELECTED' && !selectedFileRef.current)) {
        throw new Error('Nenhum dado para gerar SQL. Selecione um arquivo ou cole o texto.');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      if (dataToProcess.endsWith(',')) dataToProcess = dataToProcess.slice(0, -1);
      
      setProgress({ current: 20, total: 100, stage: 'Parseando JSON...' });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      let rawData;
      try {
        rawData = JSON.parse(dataToProcess);
      } catch (e) {
        setProgress({ current: 25, total: 100, stage: 'Corrigindo formato legado...' });
        await new Promise(resolve => setTimeout(resolve, 50));
        dataToProcess = dataToProcess
          .replace(/\bnulo\b/g, 'null')
          .replace(/\bverdadeiro\b/g, 'true')
          .replace(/\bfalso\b/g, 'false');
        rawData = JSON.parse(dataToProcess);
      }

      if (!rawData) {
        throw new Error('O arquivo está vazio ou contém um JSON inválido (null).');
      }

      let rawClients: any[] = [];
      let rawProfessionals: any[] = [];
      let rawAppointments: any[] = [];
      let rawTransactions: any[] = [];
      let rawProducts: any[] = [];

      const identifyArray = (arr: any[]) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const first = arr[0];
        if (!first) return;
        // Use concat to avoid RangeError on large arrays
        if (first.hora_inicio || first.time || first.servico || first.service) rawAppointments = rawAppointments.concat(arr);
        else if (first.papel || first.role || first.commission) rawProfessionals = rawProfessionals.concat(arr);
        else if (first.telefone || first.phone || first.email || first.points) rawClients = rawClients.concat(arr);
        else if (first.tipo === 'Receita' || first.tipo === 'Despesa' || first.type === 'Receita' || first.type === 'Despesa' || first.method || first.metodo) rawTransactions = rawTransactions.concat(arr);
        else if (first.price || first.preco || first.stock || first.estoque) rawProducts = rawProducts.concat(arr);
      };

      if (Array.isArray(rawData)) {
        identifyArray(rawData);
      } else if (typeof rawData === 'object') {
        Object.values(rawData).forEach(val => { 
          if (Array.isArray(val)) identifyArray(val); 
        });
      }

      setProgress({ current: 40, total: 100, stage: 'Mapeando Clientes...' });
      const mappedClients: Client[] = rawClients.map((c: any) => ({
        id: c.id || Math.random().toString(36).substr(2, 9),
        name: c.nome || c.name || c.displayName || 'Sem Nome',
        email: c.email || '',
        phone: c.telefone || c.phone || c.celular || '',
        status: (['Ativo', 'Inadimplente', 'Inativo'].includes(c.status) ? c.status : 'Ativo') as any,
        points: Number(c.pontos || c.points || 0),
        totalSpent: Number(c.total_gasto || c.totalSpent || 0),
        level: (Number(c.total_gasto || c.totalSpent || 0)) > 1000 ? 'Viking' : (Number(c.total_gasto || c.totalSpent || 0)) > 500 ? 'Ouro' : (Number(c.total_gasto || c.totalSpent || 0)) > 200 ? 'Prata' : 'Bronze',
        lastVisit: normalizeDate(c.ultima_visita || c.lastVisit || c.last_visit || ''),
        birthDate: normalizeDate(c.data_nascimento || c.birthDate || c.aniversario || c.birth_date || ''),
        instagram: c.instagram || c.ig || c.insta || '',
        city: c.cidade || c.city || '',
        medicalNotes: c.notas_medicas || c.medicalNotes || c.historico_medico || c.medical_notes || '',
        indicatedBy: c.indicado_por || c.indicatedBy || c.indicated_by || '',
        isMinor: Boolean(c.menor_de_idade || c.isMinor || c.is_minor || false),
        notes: c.notas || c.notas || c.observacoes || ''
      }));

      setProgress({ current: 50, total: 100, stage: 'Mapeando Profissionais...' });
      const mappedProfessionals: Professional[] = rawProfessionals.map((p: any) => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        name: p.nome || p.name || 'Sem Nome',
        role: p.papel || p.role || 'Profissional',
        specialty: [p.tipo || p.specialty || 'Geral'],
        rating: 5,
        status: p.ativo || p.active ? 'Disponível' : 'Ausente',
        avatar: p.url_da_foto || p.avatar || '',
        commission: p.porcentagem_de_comissão || p.commission || 0,
        signature: p.assinatura || p.signature || ''
      }));

      setProgress({ current: 60, total: 100, stage: 'Mapeando Agendamentos...' });
      
      const clientMap = new Map(mappedClients.map(c => [c.id, c]));
      const proMap = new Map(mappedProfessionals.map(p => [p.id, p]));
      
      // Also include existing clients/pros for lookup
      const existingClientMap = new Map(clients.map(c => [c.id, c]));
      const existingProMap = new Map(professionals.map(p => [p.id, p]));

      const findProByName = (name: string) => {
        if (!name) return null;
        const normalized = name.toLowerCase().trim();
        const mappedMatch = mappedProfessionals.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
        if (mappedMatch) return mappedMatch;
        return professionals.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
      };

      const mappedAppointments: Appointment[] = rawAppointments.map((a: any) => {
        const clientId = a.cliente_id || a.clientId;
        const proId = a.profissional_id || a.professionalId;
        const proNameInput = a.professionalName || a.nomeProfissional || a.profissional || a.professional;
        
        const client = clientMap.get(clientId) || existingClientMap.get(clientId);
        let pro = proMap.get(proId) || existingProMap.get(proId);

        if (!pro && proNameInput) {
          pro = findProByName(proNameInput);
        }

        return {
          id: a.id || Math.random().toString(36).substr(2, 9),
          clientId,
          clientName: client?.name || a.clientName || a.nomeCliente || 'Cliente',
          professionalId: pro?.id || proId,
          professionalName: pro?.name || proNameInput || 'Profissional',
          service: a.descricao_servico || a.service || a.servico || a.descricao || 'Serviço',
          date: normalizeDate(a.dados || a.date || a.data || ''),
          time: String(a.hora_inicio || a.time || a.hora || '00:00').substring(0, 5),
          status: a.status === 'falta' ? 'Falta' : (a.status === 'concluido' ? 'Finalizado' : 'Confirmado'),
          value: Number(a.valor_total || a.value || a.valor || a.total_value || 0),
          duration: Number(a.duracao || a.duration || a.tempo || 60)
        };
      });

      setProgress({ current: 70, total: 100, stage: 'Mapeando Transações...' });
      const mappedTransactions = rawTransactions.map((t: any) => ({
        id: t.id || Math.random().toString(36).substr(2, 9),
        description: t.descricao || t.description || 'Transação',
        value: Number(t.valor || t.value || 0),
        type: (['Receita', 'Despesa'].includes(t.tipo || t.type) ? (t.tipo || t.type) : 'Receita') as any,
        category: t.categoria || t.category || 'Geral',
        date: normalizeDate(t.data || t.date || ''),
        status: (['Pago', 'Pendente'].includes(t.status) ? t.status : 'Pago') as any,
        method: (['Pix', 'Dinheiro', 'Cartão'].includes(t.metodo || t.method) ? (t.metodo || t.method) : 'Dinheiro') as any
      }));

      setProgress({ current: 75, total: 100, stage: 'Mapeando Produtos...' });
      const mappedProducts = rawProducts.map((p: any) => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        name: p.nome || p.name || 'Produto',
        category: p.categoria || p.category || 'Geral',
        price: Number(p.preco || p.price || 0),
        stock: Number(p.estoque || p.stock || 0),
        rating: Number(p.avaliacao || p.rating || 5),
        image: p.imagem || p.image || ''
      }));

      setProgress({ current: 80, total: 100, stage: 'Gerando SQL...' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const escapeSql = (val: any) => {
        if (val === null || val === undefined || val === '') return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val;
        if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return `'${String(val).replace(/'/g, "''")}'`;
      };

      let sqlChunks: string[] = [`-- Script de Importação Gerado\n-- Data: ${new Date().toISOString()}\n\n`];

      if (mappedClients.length > 0) {
        sqlChunks.push(`-- Tabela: clients\n`);
        sqlChunks.push(`INSERT INTO clients (id, name, email, phone, status, points, total_spent, level, last_visit, birth_date, instagram, city, medical_notes, indicated_by, is_minor, notes) VALUES\n`);
        const values = mappedClients.map(c => `(${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.email)}, ${escapeSql(c.phone)}, ${escapeSql(c.status)}, ${escapeSql(c.points)}, ${escapeSql(c.totalSpent)}, ${escapeSql(c.level)}, ${escapeSql(c.lastVisit)}, ${escapeSql(c.birthDate)}, ${escapeSql(c.instagram)}, ${escapeSql(c.city)}, ${escapeSql(c.medicalNotes)}, ${escapeSql(c.indicatedBy)}, ${escapeSql(c.isMinor)}, ${escapeSql(c.notes)})`);
        sqlChunks.push(values.join(',\n') + ';\n\n');
      }

      if (mappedProfessionals.length > 0) {
        sqlChunks.push(`-- Tabela: professionals\n`);
        sqlChunks.push(`INSERT INTO professionals (id, name, role, specialty, rating, status, avatar, commission, assinatura) VALUES\n`);
        const values = mappedProfessionals.map(p => `(${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.role)}, ${escapeSql(p.specialty)}, ${escapeSql(p.rating)}, ${escapeSql(p.status)}, ${escapeSql(p.avatar)}, ${escapeSql(p.commission)}, ${escapeSql(p.signature)})`);
        sqlChunks.push(values.join(',\n') + ';\n\n');
      }

      if (mappedAppointments.length > 0) {
        sqlChunks.push(`-- Tabela: appointments\n`);
        sqlChunks.push(`INSERT INTO appointments (id, client_id, client_name, professional_id, professional_name, service, date, time, status, value, duration) VALUES\n`);
        const values = mappedAppointments.map(a => `(${escapeSql(a.id)}, ${escapeSql(a.clientId)}, ${escapeSql(a.clientName)}, ${escapeSql(a.professionalId)}, ${escapeSql(a.professionalName)}, ${escapeSql(a.service)}, ${escapeSql(a.date)}, ${escapeSql(a.time)}, ${escapeSql(a.status)}, ${escapeSql(a.value)}, ${escapeSql(a.duration)})`);
        sqlChunks.push(values.join(',\n') + ';\n\n');
      }

      if (mappedTransactions.length > 0) {
        sqlChunks.push(`-- Tabela: transactions\n`);
        sqlChunks.push(`INSERT INTO transactions (id, description, value, type, category, date, status, method) VALUES\n`);
        const values = mappedTransactions.map(t => `(${escapeSql(t.id)}, ${escapeSql(t.description)}, ${escapeSql(t.value)}, ${escapeSql(t.type)}, ${escapeSql(t.category)}, ${escapeSql(t.date)}, ${escapeSql(t.status)}, ${escapeSql(t.method)})`);
        sqlChunks.push(values.join(',\n') + ';\n\n');
      }

      if (mappedProducts.length > 0) {
        sqlChunks.push(`-- Tabela: products\n`);
        sqlChunks.push(`INSERT INTO products (id, name, category, price, stock, rating, image) VALUES\n`);
        const values = mappedProducts.map(p => `(${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.category)}, ${escapeSql(p.price)}, ${escapeSql(p.stock)}, ${escapeSql(p.rating)}, ${escapeSql(p.image)})`);
        sqlChunks.push(values.join(',\n') + ';\n\n');
      }

      setProgress({ current: 100, total: 100, stage: 'Download iniciado...' });

      const blob = new Blob(sqlChunks, { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `importacao_${new Date().getTime()}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('SQL gerado e download iniciado com sucesso!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('SQL Generation error:', err);
      setError(`Erro ao gerar SQL: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const cleanupDuplicates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: 100, stage: 'Buscando duplicatas...' });

    try {
      // 1. Cleanup Clients
      const uniqueClients = new Map<string, Client>();
      const duplicateClientIds: string[] = [];
      const clientsToKeep: Client[] = [];
      const clientRemap: Record<string, string> = {}; // oldId -> newId

      for (const client of clients) {
        // Create a unique key based on phone or cpf or name
        let key = '';
        if (client.phone && client.phone.length > 5) key = `phone_${client.phone.replace(/\D/g, '')}`;
        else if (client.cpf && client.cpf.length > 5) key = `cpf_${client.cpf.replace(/\D/g, '')}`;
        else key = `name_${client.name.toLowerCase().trim()}`;
        
        if (uniqueClients.has(key)) {
          duplicateClientIds.push(client.id);
          clientRemap[client.id] = uniqueClients.get(key)!.id;
        } else {
          uniqueClients.set(key, client);
          clientsToKeep.push(client);
        }
      }

      if (duplicateClientIds.length > 0) {
        setProgress({ current: 30, total: 100, stage: `Removendo ${duplicateClientIds.length} clientes duplicados...` });
        
        // First, update appointments that point to duplicate clients
        const appointmentsToUpdate = appointments.filter(a => clientRemap[a.clientId]);
        if (appointmentsToUpdate.length > 0) {
          for (const appt of appointmentsToUpdate) {
            appt.clientId = clientRemap[appt.clientId];
            const keptClient = clientsToKeep.find(c => c.id === appt.clientId);
            if (keptClient) appt.clientName = keptClient.name;
          }
          
          for (let i = 0; i < appointmentsToUpdate.length; i += 50) {
            const batch = appointmentsToUpdate.slice(i, i + 50);
            await supabase.from('appointments').upsert(toSnakeCase(batch));
          }
          
          setAppointments(prev => prev.map(a => clientRemap[a.clientId] ? { ...a, clientId: clientRemap[a.clientId], clientName: clientsToKeep.find(c => c.id === clientRemap[a.clientId])?.name || a.clientName } : a));
        }

        // Now delete the duplicate clients
        for (let i = 0; i < duplicateClientIds.length; i += 50) {
          const batch = duplicateClientIds.slice(i, i + 50);
          await supabase.from('clients').delete().in('id', batch);
        }
        setClients(clientsToKeep);
      }

      // 2. Cleanup Appointments
      const uniqueAppointments = new Map<string, Appointment>();
      const duplicateAppointmentIds: string[] = [];
      const appointmentsToKeep: Appointment[] = [];

      for (const appt of appointments) {
        // Unique key: date + time + professionalId + clientId
        const key = `${appt.date}_${appt.time}_${appt.professionalId}_${appt.clientId}`;
        
        if (uniqueAppointments.has(key)) {
          duplicateAppointmentIds.push(appt.id);
        } else {
          uniqueAppointments.set(key, appt);
          appointmentsToKeep.push(appt);
        }
      }

      if (duplicateAppointmentIds.length > 0) {
        setProgress({ current: 60, total: 100, stage: `Removendo ${duplicateAppointmentIds.length} agendamentos duplicados...` });
        for (let i = 0; i < duplicateAppointmentIds.length; i += 50) {
          const batch = duplicateAppointmentIds.slice(i, i + 50);
          await supabase.from('appointments').delete().in('id', batch);
        }
        setAppointments(appointmentsToKeep);
      }

      setSuccess(`Limpeza concluída! Removidos ${duplicateClientIds.length} clientes e ${duplicateAppointmentIds.length} agendamentos duplicados.`);
    } catch (err: any) {
      console.error('Cleanup error:', err);
      setError(`Erro ao limpar duplicatas: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/20 text-primary rounded-2xl">
          <Database size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-serif italic text-primary uppercase">Importar Backup</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Importe dados de backups antigos ou externos</p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-[40px] p-8 space-y-8">
        {/* File Upload Area */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Upload de Arquivo</label>
          <div 
            className={cn(
              "relative border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
              fileName ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-primary/30 hover:bg-white/5"
            )}
            onClick={() => {
              console.log('Upload area clicked');
              fileInputRef.current?.click();
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.txt"
              className="hidden"
              onClick={(e) => e.stopPropagation()} // Prevent double trigger
            />
            
            {loading && !fileName ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Lendo arquivo...</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/20 text-primary rounded-2xl">
                    <FileText size={40} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{fileName}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Arquivo carregado e analisado</p>
                  </div>
                </div>

                {fileSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-serif italic text-primary">{fileSummary.clients}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Clientes</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-serif italic text-primary">{fileSummary.professionals}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Profissionais</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                      <p className="text-2xl font-serif italic text-primary">{fileSummary.appointments}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Agendamentos</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                      <p className="text-2xl font-serif italic text-primary">{fileSummary.total}</p>
                      <p className="text-[10px] uppercase tracking-widest text-primary mt-1">Total</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-destructive transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white/5 text-gray-400 rounded-2xl group-hover:text-primary transition-colors">
                  <Upload size={40} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-300">Clique ou arraste o arquivo aqui</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Suporta arquivos .json ou .txt de qualquer tamanho</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold text-gray-600">
            <span className="bg-card px-4">Ou cole o texto abaixo</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Dados do Backup (JSON)</label>
          {fileName ? (
            <div className="w-full h-48 bg-black/40 border border-primary/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-primary">
              <CheckCircle2 size={32} />
              <p className="text-sm font-bold">Conteúdo do arquivo carregado</p>
              <p className="text-[10px] uppercase tracking-widest opacity-60">Clique em "Iniciar Importação" para processar</p>
            </div>
          ) : (
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ou cole aqui o JSON do backup..."
              className="w-full h-48 bg-black/40 border border-white/5 rounded-3xl py-6 px-8 text-sm font-mono focus:border-primary/50 outline-none transition-all resize-none custom-scrollbar"
            />
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-between gap-3 text-success text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
              <button 
                onClick={clearFile}
                className="px-4 py-2 bg-success/20 hover:bg-success/30 rounded-xl font-bold uppercase tracking-widest transition-all"
              >
                Nova Importação
              </button>
            </div>
          </div>
        )}

        {progress && (
          <div className="space-y-3 p-6 bg-primary/5 border border-primary/20 rounded-3xl">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>{progress.stage}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {mappingConfig && aiResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Settings2 size={20} />
                <h3 className="font-bold uppercase tracking-widest text-sm">Mapeamento Identificado</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(mappingConfig).map(([key, value]) => (
                  Object.keys(value).length > 0 && (
                    <div key={key} className="p-4 bg-black/20 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{key}</p>
                      <div className="space-y-1">
                        {Object.entries(value).slice(0, 5).map(([orig, target]) => (
                          <div key={orig} className="flex justify-between text-xs">
                            <span className="text-gray-500">{orig}</span>
                            <span className="text-gray-300">→ {String(target)}</span>
                          </div>
                        ))}
                        {Object.keys(value).length > 5 && (
                          <p className="text-[10px] text-gray-600 italic">...e mais {Object.keys(value).length - 5} campos</p>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="flex items-center gap-3 text-primary mt-8">
                <Zap size={20} />
                <h3 className="font-bold uppercase tracking-widest text-sm">Amostra de Dados (Preview)</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-2xl font-serif italic text-primary">{aiResult.clients.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Clientes</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-2xl font-serif italic text-primary">{aiResult.professionals.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Profissionais</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-2xl font-serif italic text-primary">{aiResult.appointments.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Agendamentos</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-2xl font-serif italic text-primary">{aiResult.transactions.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Transações</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleFullImport();
                  }}
                  disabled={aiLoading}
                  className="flex-1 bg-primary text-black font-bold py-4 rounded-2xl uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                  Importar Todo o Backup
                </button>
                <button 
                  onClick={() => {
                    setMappingConfig(null);
                    setAiResult(null);
                  }}
                  className="px-8 bg-white/5 text-white font-bold py-4 rounded-2xl uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              console.log('Manual Import button clicked');
              handleImport();
            }}
            disabled={loading || aiLoading || !!mappingConfig}
            className="bg-white/5 text-white font-bold py-6 rounded-[32px] uppercase tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-2 border border-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Database size={24} />}
            <span className="text-center text-[10px] md:text-xs">Importação Direta</span>
          </button>

          <button 
            onClick={handleSmartImport}
            disabled={loading || aiLoading || !!mappingConfig}
            className="bg-primary/10 text-primary font-bold py-6 rounded-[32px] uppercase tracking-widest hover:bg-primary/20 transition-all flex flex-col items-center gap-2 border border-primary/20 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={24} />}
            <span className="text-center text-[10px] md:text-xs">Análise Inteligente</span>
          </button>

          <button 
            onClick={generateSql}
            disabled={loading || aiLoading || !!mappingConfig}
            className="bg-white/5 text-white font-bold py-6 rounded-[32px] uppercase tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-2 border border-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Download size={24} />}
            <span className="text-center text-[10px] md:text-xs">Gerar SQL</span>
          </button>

          <button 
            onClick={cleanupDuplicates}
            disabled={loading || aiLoading || !!mappingConfig}
            className="bg-destructive/10 text-destructive font-bold py-6 rounded-[32px] uppercase tracking-widest hover:bg-destructive/20 transition-all flex flex-col items-center gap-2 border border-destructive/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Trash2 size={24} />}
            <span className="text-center text-[10px] md:text-xs">Limpar Duplicados</span>
          </button>
        </div>

        <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Instruções</h4>
          <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
            <li>O sistema aceita o formato de backup legado (com campos em português).</li>
            <li>Termos como 'nulo', 'verdadeiro' e 'falso' serão corrigidos automaticamente.</li>
            <li>Dados duplicados (mesmo ID) serão atualizados.</li>
            <li>Certifique-se de que o JSON está completo para evitar erros de mapeamento.</li>
            <li>Use a IA para backups com estruturas desconhecidas ou complexas.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
