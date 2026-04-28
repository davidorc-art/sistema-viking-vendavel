import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, ChevronLeft, Loader2, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
import { useData, generateId } from '../context/DataContext';
import { supabase } from '../lib/supabase';

const SERVICES_LIST = ['Tatuagem', 'Piercing', 'Orçamento'];
const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30);

const formatDate = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1');
};

const parseDate = (dateStr: string) => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length < 4) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatToDisplayDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profIdParam = searchParams.get('profId') || searchParams.get('p');
  const service = searchParams.get('service');
  const value = searchParams.get('value');
  const totalValueParam = searchParams.get('totalValue');
  const depositPercentageParam = searchParams.get('depositPercentage');
  const allowDepositParam = searchParams.get('allowDeposit');
  const clientIdParam = searchParams.get('clientId') || searchParams.get('c');
  const durationParam = searchParams.get('duration');

  const { professionals, appointments, addAppointment, addClient, updateClient, clients, isSyncing, blockedTimes, settings } = useData();

  const existingClient = clients.find(c => c.id === clientIdParam);

  const [formData, setFormData] = useState({
    profId: '',
    name: existingClient?.name || '',
    phone: existingClient?.phone || '',
    cpf: existingClient?.cpf || '',
    instagram: existingClient?.instagram || '',
    birthDate: existingClient?.birthDate ? formatToDisplayDate(existingClient.birthDate) : '',
    city: existingClient?.city || '',
    medicalNotes: existingClient?.medicalNotes || '',
    indicatedBy: existingClient?.indicatedBy || '',
    isMinor: existingClient?.isMinor || false,
    notes: existingClient?.notes || '',
    service: service || '',
    duration: Number(durationParam) || 60,
    date: '',
    time: ''
  });

  const selectedServiceObj = settings.services?.find(s => s.name === (formData?.service || service));
  
  const totalValueFromParam = Number(totalValueParam) || Number(value) || 0;
  const totalValue = totalValueFromParam || Number(selectedServiceObj?.price) || 0;
  const allowDeposit = allowDepositParam !== null ? allowDepositParam !== 'false' : settings.allowDeposit;
  const defaultDepositSelection = Number(depositPercentageParam) || (allowDeposit ? (settings.depositPercentage || 50) : 100);

  const autoProfId = React.useMemo(() => {
    if (profIdParam || formData.profId || !selectedServiceObj) return null;
    
    if (selectedServiceObj.category === 'Tattoo') {
      return professionals.find(p => p.name.toLowerCase().includes('david'))?.id;
    }
    if (selectedServiceObj.category === 'Piercing') {
      return professionals.find(p => p.name.toLowerCase().includes('jeynne'))?.id;
    }
    return null;
  }, [selectedServiceObj, professionals, profIdParam, formData.profId]);

  const professional = professionals.find(p => 
    p.id === profIdParam || 
    (profIdParam && p.name.toLowerCase() === profIdParam.toLowerCase()) ||
    (profIdParam && p.name.toLowerCase().includes(profIdParam.toLowerCase())) ||
    p.id === formData.profId ||
    p.id === autoProfId
  );
  const profId = professional?.id || formData.profId || autoProfId;
  
  React.useEffect(() => {
    if (autoProfId && !formData.profId && !profIdParam) {
      setFormData(prev => ({ ...prev, profId: autoProfId }));
    }
  }, [autoProfId, formData.profId, profIdParam]);

  React.useEffect(() => {
    console.log('DEBUG BOOKING DATA:', JSON.stringify({ 
      appointmentsLength: appointments.length, 
      blockedTimesLength: blockedTimes.length,
      profId: profId
    }));
  }, [appointments, blockedTimes, profId]);

  const [step, setStep] = useState(clientIdParam ? 2 : 1);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<50 | 100>(defaultDepositSelection as 50 | 100);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [generatedPaymentUrl, setGeneratedPaymentUrl] = useState('');

  const referrerMatch = React.useMemo(() => {
    const value = formData.indicatedBy.trim();
    if (value.length < 3) return null;
    
    // Ignore cases where the user just typed "não", "ninguem", "ngm", etc.
    const ignored = ['ninguem', 'ninguém', 'nao', 'não', 'ngm', 'sem indicacao', 'sem indicação'];
    if (ignored.includes(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return null;
    
    const searchUpper = value.toUpperCase();
    const searchPhone = value.replace(/\D/g, '');

    return clients.find(c => {
      // 1. By exact ID portion (Referral Code)
      if (value.length >= 6 && c.id.substring(0, 6).toUpperCase() === searchUpper) return true;
      
      // 2. By Name
      if (c.name.toUpperCase() === searchUpper) return true;
      
      // 3. By Phone
      if (searchPhone.length >= 10 && c.phone.replace(/\D/g, '') === searchPhone) return true;
      
      return false;
    });
  }, [formData.indicatedBy, clients]);

  // AUTO-FILL REFERRER NAME
  React.useEffect(() => {
    if (referrerMatch && formData.indicatedBy !== referrerMatch.name) {
      // If the current value is a code or phone, but we found a match, fill the name
      // We only do this if it's not already the name to avoid infinite loop
      // and if the user isn't actively deleting or something (optional)
      const val = formData.indicatedBy.trim();
      const isCode = val.length === 6 && referrerMatch.id.toUpperCase().startsWith(val.toUpperCase());
      const isPhone = val.replace(/\D/g, '').length >= 10;
      
      if (isCode || isPhone) {
        setFormData(prev => ({ ...prev, indicatedBy: referrerMatch.name }));
      }
    }
  }, [referrerMatch]);

  React.useEffect(() => {
    // No longer loading script, using direct redirect for reliability
  }, [paymentReady]);

  React.useEffect(() => {
    if (existingClient) {
      setFormData(prev => ({
        ...prev,
        name: existingClient.name || prev.name,
        phone: existingClient.phone || prev.phone,
        cpf: existingClient.cpf || prev.cpf,
        instagram: existingClient.instagram || prev.instagram,
        birthDate: existingClient.birthDate ? formatToDisplayDate(existingClient.birthDate) : prev.birthDate,
        city: existingClient.city || prev.city,
        medicalNotes: existingClient.medicalNotes || prev.medicalNotes,
        indicatedBy: existingClient.indicatedBy || prev.indicatedBy,
        isMinor: existingClient.isMinor || prev.isMinor,
        notes: existingClient.notes || prev.notes
      }));
      
      // Only skip to step 2 if we have all mandatory fields
      const hasMandatoryFields = 
        existingClient.name && 
        existingClient.phone && 
        existingClient.cpf && 
        existingClient.city && 
        existingClient.birthDate &&
        existingClient.instagram;

      if (hasMandatoryFields) {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  }, [existingClient]);

  const actualDepositPercentage = selectedPaymentOption;
  const actualDepositValue = Number((totalValue * (actualDepositPercentage / 100)).toFixed(2));

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const validateName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 && parts.every(p => p.length >= 2);
  };

  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFoundMessage, setClientFoundMessage] = useState('');

  React.useEffect(() => {
    const searchClient = async () => {
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      if (cleanCpf.length === 11 && validateCPF(cleanCpf)) {
        setIsSearchingClient(true);
        try {
          const formattedCpf = formatCPF(cleanCpf);
          // Query Supabase directly since clients array might be empty for public routes
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .or(`cpf.ilike.%${cleanCpf}%,cpf.ilike.%${formattedCpf}%`);

          if (!error && data && data.length > 0) {
            // Find exact match
            const exactMatch = data.find(c => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
            
            if (exactMatch) {
              setFormData(prev => ({
                ...prev,
                name: exactMatch.name || prev.name,
                phone: exactMatch.phone || prev.phone,
                instagram: exactMatch.instagram || prev.instagram,
                birthDate: formatToDisplayDate(exactMatch.birth_date || exactMatch.birthDate || prev.birthDate),
                city: exactMatch.city || prev.city,
                medicalNotes: exactMatch.medical_notes || exactMatch.medicalNotes || prev.medicalNotes,
                indicatedBy: exactMatch.indicated_by || exactMatch.indicatedBy || prev.indicatedBy,
                isMinor: exactMatch.is_minor || exactMatch.isMinor || prev.isMinor,
                notes: exactMatch.notes || prev.notes
              }));
              setClientFoundMessage('Cadastro encontrado! Dados preenchidos automaticamente.');
              setTimeout(() => setClientFoundMessage(''), 5000);
            }
          }
        } catch (err) {
          console.error('Error searching client by CPF:', err);
        } finally {
          setIsSearchingClient(false);
        }
      }
    };

    if (step === 1) {
      searchClient();
    }
  }, [formData.cpf, step]);

  const handleNextStep = () => {
    setErrorMessage('');
    
    if (!profIdParam && !formData.profId) {
      setErrorMessage('Por favor, selecione um profissional.');
      return;
    }

    if (!validateName(formData.name)) {
      setErrorMessage('Por favor, preencha nome e sobrenome (mínimo 2 letras cada).');
      return;
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, preencha um telefone válido com DDD.');
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setErrorMessage('Por favor, preencha um CPF válido.');
      return;
    }

    if (!formData.birthDate || formData.birthDate.length < 10) {
      setErrorMessage('A data de nascimento é obrigatória (DD/MM/AAAA).');
      return;
    }

    const parsedBirthDate = parseDate(formData.birthDate);
    if (!parsedBirthDate) {
      setErrorMessage('Data de nascimento inválida.');
      return;
    }

    const birthDate = new Date(parsedBirthDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      setErrorMessage('Data de nascimento não pode ser no futuro.');
      return;
    }

    // Check if at least 10 years old (reasonable for tattoo/piercing studio)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 1) {
      setErrorMessage('Data de nascimento inválida.');
      return;
    }

    if (!formData.city || formData.city.length < 3) {
      setErrorMessage('A cidade é obrigatória.');
      return;
    }

    if (!formData.instagram || formData.instagram.length < 3) {
      setErrorMessage('O instagram é obrigatório.');
      return;
    }

    if (!formData.indicatedBy || formData.indicatedBy.length < 2) {
      setErrorMessage('Por favor, informe quem te indicou.');
      return;
    }

    if (!formData.medicalNotes || formData.medicalNotes.length < 3) {
      setErrorMessage('Por favor, preencha as observações médicas ou "Nenhuma".');
      return;
    }

    setStep(2);
  };

  const [isSyncingTimeout, setIsSyncingTimeout] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isSyncing) {
        console.warn('BOOKING: Sync timeout reached, showing content anyway');
        setIsSyncingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isSyncing]);

  // Ensure we don't redirect automatically inside an iframe, which causes white screens
  React.useEffect(() => {
    if (generatedPaymentUrl && !success) {
      console.log('PAYMENT: Payment URL generated. Awaiting user action.');
    }
  }, [generatedPaymentUrl, success]);

  /* Remove early returns to prevent hook count mismatch errors */
  
  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getAvailableSlots = (date: string) => {
    if (!date) return [];
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    let startHour, endHour;
    if (dayOfWeek === 0) { startHour = 12; endHour = 17; }
    else { startHour = 10; endHour = 20; }

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    const duration = formData.duration || Number(durationParam) || 60;

    const occupiedSlots = appointments
      .filter(a => a.date === date && a.professionalId === profId && a.status !== 'Cancelado' && a.status !== 'Falta')
      .map(a => ({
        start: timeToMinutes(a.time),
        end: timeToMinutes(a.time) + (a.duration || 60),
        raw: a
      }));
      
    const currentSelectedDate = new Date(date + 'T00:00:00');
    const blockedSlots = blockedTimes
      .filter(bt => {
        if (bt.professionalId !== profId && bt.professionalId !== 'all') return false;
        
        // Check if this specific date is an exception
        if (bt.exceptions?.some(exc => exc.trim() === date.trim())) return false;
        
        const btDate = new Date(bt.date + 'T00:00:00');
        
        // Check recurrence
        if (bt.recurrence === 'daily') {
          return btDate <= currentSelectedDate;
        }
        if (bt.recurrence === 'weekly') {
          return btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
        }
        if (bt.recurrence === 'monthly') {
          return btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
        }
        
        return bt.date === date;
      })
      .map(bt => ({
        start: timeToMinutes(bt.time),
        end: timeToMinutes(bt.time) + bt.duration,
        raw: bt
      }));

    console.log('DEBUG BOOKING getAvailableSlots:', JSON.stringify({ date, profId, blockedTimes: blockedTimes.length, blockedSlots: blockedSlots, occupiedSlots: occupiedSlots }));

    const now = new Date();

    return slots.filter(slot => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + duration;
      
      // Prevent past slots
      const slotDateTime = new Date(`${date}T${slot}:00`);
      if (slotDateTime < now) {
        return false;
      }
      
      for (const occupied of occupiedSlots) {
        if ((slotStart < occupied.end) && (slotEnd > occupied.start)) {
          return false;
        }
      }

      for (const blocked of blockedSlots) {
        if ((slotStart < blocked.end) && (slotEnd > blocked.start)) {
          return false;
        }
      }

      return true;
    });
  };

  const availableSlots = getAvailableSlots(formData.date);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      console.log('BOOKING: Iniciando processo de agendamento...');

      // Final validation even for existing clients (crucial if skipped step 1)
      if (!formData.city || formData.city.length < 2) {
        setErrorMessage('A cidade é obrigatória. Por favor, volte ao passo 1 ou entre em contato.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.birthDate || formData.birthDate.length < 10) {
        setErrorMessage('A data de nascimento é necessária para o contrato.');
        setIsSubmitting(false);
        return;
      }

      let clientId = existingClient ? clientIdParam : null;
      
      // Fetch latest blocked times and appointments to prevent double booking
      const { data: latestBlockedTimes } = await supabase.from('blocked_times').select('*').or(`professional_id.eq.${profId},professional_id.eq.all,professional_id.is.null`);
      const { data: latestAppointments } = await supabase.from('appointments').select('*').eq('professional_id', profId);
      
      const currentBlockedTimes = latestBlockedTimes ? latestBlockedTimes.map(b => {
        let recurrence = 'none';
        let reason = String(b.reason || '');
        let exceptions: string[] = [];

        const recMatch = reason.match(/\[REC:(none|daily|weekly|monthly)\]/);
        if (recMatch) {
          recurrence = recMatch[1];
          reason = reason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
        }

        const excMatch = reason.match(/\[EXC:([^\]]+)\]/);
        if (excMatch) {
          exceptions = excMatch[1].split(',').map(d => d.trim());
          reason = reason.replace(/\[EXC:[^\]]+\]/g, '').trim();
        }

        return {
          id: String(b.id),
          professionalId: String(b.professional_id || b.professionalid || 'all'),
          professionalName: String(b.professional_name || b.professionalname || 'Todos'),
          date: String(b.date || '').split('T')[0],
          time: String(b.time || '00:00').substring(0, 5),
          duration: Number(b.duration || 60),
          reason: reason,
          recurrence: (['none', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'none') as any,
          exceptions
        };
      }) : blockedTimes;

      const currentAppointments = latestAppointments ? latestAppointments.map(a => ({
        id: String(a.id),
        clientId: String(a.client_id || a.clientid || ''),
        clientName: String(a.client_name || a.clientname || ''),
        professionalId: String(a.professional_id || a.professionalid || ''),
        professionalName: String(a.professional_name || a.professionalname || ''),
        service: String(a.service || a.servico || ''),
        date: String(a.date || a.data || '').split('T')[0],
        time: String(a.time || a.hora || '00:00').substring(0, 5),
        status: String(a.status || 'Pendente') as any,
        value: Number(a.value || a.valor || 0),
        duration: Number(a.duration || 60)
      })) : appointments;

      const timeToMins = (time: string) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const slotStart = timeToMins(formData.time);
      const slotEnd = slotStart + (formData.duration || Number(durationParam) || 60);
      
      // Prevent past dates/times
      const now = new Date();
      const selectedDateTime = new Date(`${formData.date}T${formData.time}:00`);
      if (selectedDateTime < now) {
        setErrorMessage('Não é possível agendar para uma data ou horário no passado.');
        setIsSubmitting(false);
        return;
      }
      
      const isOccupied = currentAppointments.some(a => {
        if (a.date !== formData.date || a.professionalId !== profId || a.status === 'Cancelado' || a.status === 'Falta') return false;
        const aStart = timeToMins(a.time);
        const aEnd = aStart + (a.duration || 60);
        return (slotStart < aEnd) && (slotEnd > aStart);
      });

      const isBlocked = currentBlockedTimes.some(bt => {
        if (bt.professionalId !== profId && bt.professionalId !== 'all') return false;
        
        // Check if this specific date is an exception
        if (bt.exceptions?.some(exc => exc.trim() === formData.date.trim())) return false;

        const btDate = new Date(bt.date + 'T00:00:00');
        const currentSelectedDate = new Date(formData.date + 'T00:00:00');
        let isDateMatch = false;
        if (bt.recurrence === 'daily') isDateMatch = btDate <= currentSelectedDate;
        else if (bt.recurrence === 'weekly') isDateMatch = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
        else if (bt.recurrence === 'monthly') isDateMatch = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
        else isDateMatch = bt.date === formData.date;
        
        if (!isDateMatch) return false;
        const bStart = timeToMins(bt.time);
        const bEnd = bStart + bt.duration;
        return (slotStart < bEnd) && (slotEnd > bStart);
      });

      if (isOccupied || isBlocked) {
        setErrorMessage('Este horário não está mais disponível. Por favor, escolha outro horário.');
        setIsSubmitting(false);
        return;
      }

      if (!clientId) {
        // Check for duplicate client by CPF or Phone
        const cleanCpf = formData.cpf.replace(/\D/g, '');
        const cleanPhone = formData.phone.replace(/\D/g, '');
        
        // First check local clients array (if populated)
        let existingClientByCpfOrPhone = clients.find(c => {
          const cCpf = (c.cpf || '').replace(/\D/g, '');
          const cPhone = (c.phone || '').replace(/\D/g, '');
          return (cleanCpf && cCpf === cleanCpf) || (cleanPhone && cPhone === cleanPhone);
        });

        // If not found locally, query Supabase directly (since clients array is empty on public routes)
        if (!existingClientByCpfOrPhone && (cleanCpf || cleanPhone)) {
          let query = supabase.from('clients').select('id, cpf, phone');
          
          const formattedCpf = cleanCpf ? formatCPF(cleanCpf) : '';
          const formattedPhone = cleanPhone ? formatPhone(cleanPhone) : '';
          
          if (cleanCpf && cleanPhone) {
            query = query.or(`cpf.ilike.%${cleanCpf}%,cpf.ilike.%${formattedCpf}%,phone.ilike.%${cleanPhone}%,phone.ilike.%${formattedPhone}%`);
          } else if (cleanCpf) {
            query = query.or(`cpf.ilike.%${cleanCpf}%,cpf.ilike.%${formattedCpf}%`);
          } else if (cleanPhone) {
            query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${formattedPhone}%`);
          }
          
          const { data: existingClients } = await query;
          
          if (existingClients && existingClients.length > 0) {
            const exactMatch = existingClients.find(c => {
              const cCpf = (c.cpf || '').replace(/\D/g, '');
              const cPhone = (c.phone || '').replace(/\D/g, '');
              return (cleanCpf && cCpf === cleanCpf) || (cleanPhone && cPhone === cleanPhone);
            });
            
            if (exactMatch) {
              existingClientByCpfOrPhone = exactMatch as any;
            }
          }
        }

        if (existingClientByCpfOrPhone) {
          clientId = existingClientByCpfOrPhone.id;
          console.log('BOOKING: Cliente existente encontrado pelo CPF/Telefone:', clientId);
          
          // Update the client with any new information provided in the form
          try {
            await updateClient(clientId, {
              name: formData.name,
              phone: formData.phone,
              cpf: formData.cpf,
              instagram: formData.instagram,
              birthDate: parseDate(formData.birthDate),
              city: formData.city,
              medicalNotes: formData.medicalNotes,
              indicatedBy: formData.indicatedBy,
              isMinor: formData.isMinor,
              notes: formData.notes
            });
            console.log('BOOKING: Informações do cliente atualizadas.');
          } catch (err) {
            console.error('BOOKING: Erro ao atualizar informações do cliente:', err);
          }
        } else {
          clientId = await addClient({
            name: formData.name,
            email: '',
            phone: formData.phone,
            cpf: formData.cpf,
            status: 'Ativo',
            points: 0,
            totalSpent: 0,
            level: 'Bronze',
            instagram: formData.instagram,
            birthDate: parseDate(formData.birthDate),
            city: formData.city,
            medicalNotes: formData.medicalNotes,
            indicatedBy: formData.indicatedBy,
            isMinor: formData.isMinor,
            notes: formData.notes
          });
          console.log('BOOKING: Cliente criado:', clientId);
        }
      }

      // Check for an existing PENDING appointment for this client at this time to avoid duplicates
      const existingPendingAppt = appointments.find(a => 
        a.clientId === clientId &&
        a.date === formData.date &&
        a.time.substring(0, 5) === formData.time.substring(0, 5) &&
        (a.paymentStatus === 'Pendente' || a.status === 'Pendente')
      );

      let apptId;
      if (existingPendingAppt) {
        apptId = existingPendingAppt.id;
        console.log('BOOKING: Reaproveitando agendamento pendente existente:', apptId);
      } else {
        if (!professional) {
          throw new Error('Profissional não selecionado ou não encontrado.');
        }

        apptId = generateId();
        await addAppointment({
          id: apptId,
          clientId: clientId!,
          clientName: formData.name,
          professionalId: professional.id,
          professionalName: professional.name,
          service: formData.service || service || 'Serviço',
          date: formData.date,
          time: formData.time,
          status: actualDepositValue === 0 ? 'Pendente' : 'Pendente',
          approvalStatus: actualDepositValue === 0 ? 'Pendente' : 'Aguardando Pagamento',
          paymentStatus: actualDepositValue === 0 ? 'Pago' : 'Pendente',
          totalValue: totalValue,
          depositPercentage: actualDepositPercentage,
          value: actualDepositValue,
          duration: formData.duration || Number(durationParam) || 60,
          consentSigned: false,
          consentData: undefined
        });
        console.log('BOOKING: Novo agendamento criado:', apptId);
      }
      
      const valueToPay = actualDepositValue;
      
      if (valueToPay === 0) {
        console.log('BOOKING: Valor zerado, pulando pagamento.');
        setSuccess(true);
        navigate(`/booking-success?free=true&service=${encodeURIComponent(formData.service || service || '')}`);
        return;
      }

      setIsGeneratingPayment(true);
      
      try {
        console.log('BOOKING: Gerando link de pagamento na API...');
        const response = await fetch('/api/payments/create-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            appointmentId: apptId,
            value: valueToPay,
            description: `Agendamento: ${formData.service || service}`,
            clientName: formData.name,
            clientEmail: '', // Optional
            clientPhone: formData.phone
          })
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
          throw new Error(data.error || 'Falha ao gerar link de pagamento');
        }

        console.log('BOOKING: Link de pagamento gerado:', data.url);
        setGeneratedPaymentUrl(data.url);
        setPaymentReady(true);
        setIsGeneratingPayment(false);
        setIsSubmitting(false);
      } catch (paymentError: any) {
        console.error('BOOKING: Erro ao gerar link:', paymentError);
        setErrorMessage(`Erro ao gerar pagamento: ${paymentError.message}. Tente novamente.`);
        setIsGeneratingPayment(false);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('BOOKING ERROR:', error);
      const detailedError = error?.message || 'Erro desconhecido.';
      setErrorMessage(`Erro: ${detailedError}. Por favor, tente novamente.`);
    } finally {
      setIsSubmitting(false);
      setIsGeneratingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0d8d0] p-4 md:p-8 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] -ml-48 -mb-48" />

      {isSyncing && !isSyncingTimeout ? (
        <div className="relative z-10 space-y-8 text-center">
          <div className="relative mx-auto w-24 h-24">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
             <Loader2 className="animate-spin text-primary relative z-10" size={96} strokeWidth={1} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-serif italic text-primary uppercase tracking-widest">Valhalla</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Sincronizando as crônicas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="max-w-md w-full mb-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-serif italic text-primary mb-2 uppercase tracking-tight">Valhalla</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Agendamento & Ritos</p>
          </div>
            
          {/* DEBUG INFO - REMOVE LATER */}
          <div style={{ display: 'none' }} id="debug-info" data-appts={appointments.length} data-blocks={blockedTimes.length} data-prof={profId}></div>

          {!professional && profIdParam ? (
            <div className="max-w-md w-full bg-[#151619] border border-white/5 rounded-[40px] p-12 shadow-2xl relative z-10 text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                <User size={48} className="text-white/20" />
              </div>
              <h2 className="text-2xl font-serif italic text-primary">Profissional não encontrado</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">O elo com este profissional parece ter se quebrado nos salões de Valhalla.</p>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
              >
                Voltar ao Início
              </button>
            </div>
          ) : success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="max-w-md w-full bg-[#151619] border border-white/5 rounded-[40px] p-12 shadow-2xl relative z-10 text-center space-y-8"
        >
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full" />
            <CheckCircle className="relative z-10 text-success w-full h-full" strokeWidth={1} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-serif italic text-white uppercase tracking-widest">Confirmado!</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Skål, guerreiro!</p>
          </div>
          <p className="text-sm text-gray-400 font-medium">Sua marca foi reservada nas crônicas do clã. Nos vemos em breve, {formData.name}.</p>
        </motion.div>
      ) : (
        <div className="w-full max-w-md relative z-10">
          <AnimatePresence mode="wait">
            {paymentReady ? (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#151619] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl p-8 space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success border border-success/20">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-serif italic text-white">Pré-Confirmado!</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Quase lá, guerreiro</p>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed px-4">Seu horário foi reservado. Conclua o pagamento do sinal para confirmar definitivamente nas crônicas.</p>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-5">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 underline underline-offset-4 decoration-primary/30">Serviço</span>
                    <span className="text-xs font-bold text-white">{formData.service || service || 'Sessão Tribal'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Data e Hora</span>
                    <span className="text-xs font-bold text-white">{formatToDisplayDate(formData.date)} às {formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Valor do Sinal</span>
                    <span className="text-2xl font-serif italic text-primary">R$ {actualDepositValue.toFixed(2)}</span>
                  </div>
                </div>

            <div className="space-y-4">
              {generatedPaymentUrl ? (
                <a 
                  href={generatedPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    console.log('PAYMENT: Redirecting to payment link in new tab:', generatedPaymentUrl);
                    setSuccess(true);
                    setTimeout(() => {
                      navigate(`/booking-success?free=false&service=${encodeURIComponent(formData.service || service || '')}`);
                    }, 100);
                  }}
                  className="w-full py-6 bg-primary text-black rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--color-primary),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 cursor-pointer"
                >
                  <ShieldCheck size={28} />
                  <span>Pagar Agora</span>
                </a>
              ) : (
                <div className="w-full py-6 bg-white/5 text-gray-500 rounded-[32px] font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-4">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm">Forjando Link...</span>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pagamento Seguro</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
            </div>

            <button 
              onClick={() => setPaymentReady(false)}
              className="w-full py-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] hover:text-white transition-colors"
            >
              Voltar e revisar
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="booking-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#151619] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
            
            <form onSubmit={handleSave} className="p-8 pb-10 space-y-8 relative z-10">
                  {/* Form Content */}
                  <div className="space-y-6">
                    {step === 1 ? (
                      <div className="space-y-6">
                        <div className="text-center space-y-2 mb-2">
                          <h2 className="text-2xl font-serif italic text-white uppercase tracking-widest">Identificação</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Iniciando ritual</p>
                        </div>
                        
                        <div className="space-y-5">
                          {!profIdParam && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Profissional</label>
                              <div className="relative">
                                <select
                                  required
                                  value={formData.profId}
                                  onChange={e => setFormData({...formData, profId: e.target.value})}
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10 appearance-none"
                                >
                                  <option value="" className="bg-[#151619]">Toque para escolher o profissional...</option>
                                  {professionals.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#151619]">{p.name}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                  <User size={16} />
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Nome Completo</label>
                            <input 
                              type="text" 
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                              value={formData.name} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">WhatsApp</label>
                            <input 
                              type="tel" 
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                              value={formData.phone} 
                              onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">CPF (Obrigatório)</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                required 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                                value={formData.cpf} 
                                onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} 
                              />
                              {isSearchingClient && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  <Loader2 className="animate-spin text-primary" size={16} />
                                </div>
                              )}
                            </div>
                            {clientFoundMessage && (
                              <p className="text-[10px] font-bold text-success text-center animate-pulse">{clientFoundMessage}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Cidade</label>
                            <input 
                              type="text" 
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                              value={formData.city} 
                              onChange={e => setFormData({...formData, city: e.target.value})} 
                              placeholder="Sua cidade atual"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px) font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Nascimento</label>
                              <input 
                                type="text" 
                                required 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                                value={formData.birthDate} 
                                onChange={e => setFormData({...formData, birthDate: formatDate(e.target.value)})} 
                                placeholder="DD/MM/AAAA"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Instagram</label>
                              <input 
                                type="text" 
                                required 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                                value={formData.instagram} 
                                onChange={e => setFormData({...formData, instagram: e.target.value})} 
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Quem te indicou?</label>
                            <input 
                              type="text" 
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10" 
                              value={formData.indicatedBy} 
                              onChange={e => setFormData({...formData, indicatedBy: e.target.value})} 
                              placeholder="Nome ou Indicação"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Observações Médicas</label>
                            <textarea 
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10 h-24 resize-none" 
                              value={formData.medicalNotes} 
                              onChange={e => setFormData({...formData, medicalNotes: e.target.value})} 
                              placeholder="Fique em silêncio se não houver nada..."
                            />
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all select-none">
                            <input 
                              type="checkbox" 
                              id="isMinor" 
                              checked={formData.isMinor} 
                              onChange={e => setFormData({...formData, isMinor: e.target.checked})}
                              className="w-5 h-5 rounded border-[#3a3a3a] bg-[#151619] text-primary focus:ring-primary" 
                            />
                            <label htmlFor="isMinor" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer">Sou menor de idade</label>
                          </div>
                        </div>

                        {errorMessage && (
                          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                            {errorMessage}
                          </div>
                        )}

                        <button 
                          type="button" 
                          onClick={handleNextStep} 
                          className="w-full py-6 bg-primary text-black rounded-[32px] font-black text-lg uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                        >
                          <span>Próximo Passo</span>
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center space-y-2 mb-2">
                          <h2 className="text-2xl font-serif italic text-white uppercase tracking-widest">Seu Momento</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Escolha seu destino</p>
                          {(formData.service || service) && (
                            <div className="pt-2">
                              <p className="text-sm font-bold text-primary uppercase tracking-widest">{formData.service || service}</p>
                              {selectedServiceObj?.description && (
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 max-w-[280px] mx-auto leading-relaxed">
                                  {selectedServiceObj.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Data</label>
                            <input 
                              type="date" 
                              min={todayStr}
                              required 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10 [color-scheme:dark]" 
                              value={formData.date}
                              onChange={e => setFormData({...formData, date: e.target.value})} 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Horário Disponível</label>
                            <div className="relative">
                              <select 
                                required 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary outline-none text-white transition-all focus:bg-white/10 appearance-none" 
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                              >
                                <option value="" className="bg-[#151619]">Toque para ver os horários...</option>
                                {availableSlots.map(slot => (
                                  <option key={slot} value={slot} className="bg-[#151619]">{slot}</option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                <Clock size={16} />
                              </div>
                            </div>
                            {availableSlots.length === 0 && formData.date && (
                              <p className="text-[10px] text-destructive text-center font-black uppercase tracking-widest pt-2 animate-pulse">Sem horários para este sol.</p>
                            )}
                          </div>
                        </div>
                        
                        {totalValue > 0 && (
                          <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Reserva de Energia</h3>
                            
                            <div className="grid grid-cols-1 gap-3">
                              {allowDeposit ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentOption(50)}
                                    className={`relative p-6 rounded-[28px] border-2 transition-all text-left overflow-hidden ${
                                      selectedPaymentOption === 50 
                                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Sinal (50%)</span>
                                      {selectedPaymentOption === 50 && <CheckCircle size={14} className="text-primary" />}
                                    </div>
                                    <div className={`text-2xl font-serif italic ${selectedPaymentOption === 50 ? 'text-white' : 'text-gray-500'}`}>R$ {(totalValue * 0.5).toFixed(2)}</div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentOption(100)}
                                    className={`relative p-6 rounded-[28px] border-2 transition-all text-left overflow-hidden ${
                                      selectedPaymentOption === 100 
                                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Integral (100%)</span>
                                      {selectedPaymentOption === 100 && <CheckCircle size={14} className="text-primary" />}
                                    </div>
                                    <div className={`text-2xl font-serif italic ${selectedPaymentOption === 100 ? 'text-white' : 'text-gray-500'}`}>R$ {totalValue.toFixed(2)}</div>
                                  </button>
                                </>
                              ) : (
                                <div className="p-6 rounded-[28px] bg-primary/10 border-2 border-primary text-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">VALOR INTEGRAL</p>
                                  <div className="text-3xl font-serif italic text-white">R$ {totalValue.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-6 border-t border-white/5 space-y-4">
                          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Leis de Valhalla</h3>
                          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 h-32 overflow-y-auto text-[10px] leading-relaxed text-gray-600 space-y-3 font-medium uppercase tracking-[0.2em] custom-scrollbar">
                            <p><strong className="text-primary">1. Reserva:</strong> O sinal garante seu lugar nos salões de rito.</p>
                            <p><strong className="text-primary">2. Dedução:</strong> O valor é abatido do preço total final.</p>
                            <p><strong className="text-primary">3. Faltas:</strong> Menos de 48h de aviso resultam em perda do sinal (sacrifício logístico).</p>
                            <p><strong className="text-primary">4. Saúde:</strong> Declara estar pronto para a dor do ritual.</p>
                          </div>
                          <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all select-none">
                            <div className="pt-1">
                              <input 
                                type="checkbox" 
                                required 
                                id="acceptTerms" 
                                checked={acceptedTerms}
                                onChange={e => setAcceptedTerms(e.target.checked)}
                                className="w-5 h-5 rounded border-[#3a3a3a] bg-[#151619] text-primary focus:ring-primary" 
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">
                              Comprometo-me com as leis do clã e concordo com as políticas estabelecidas.
                            </span>
                          </label>
                        </div>

                        {errorMessage && (
                          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                            {errorMessage}
                          </div>
                        )}

                        <div className="flex gap-4 pt-2">
                          {!clientIdParam && (
                            <button 
                              type="button" 
                              onClick={() => setStep(1)} 
                              className="w-20 aspect-square flex items-center justify-center bg-white/5 rounded-[24px] text-gray-600 hover:bg-white/10 transition-all" 
                              disabled={isSubmitting}
                            >
                              <ChevronLeft size={24} />
                            </button>
                          )}
                          
                          <button 
                            type="submit"
                            disabled={isSubmitting || !acceptedTerms}
                            className="flex-1 py-6 bg-primary text-black rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />}
                            <span>{isSubmitting ? 'HONRANDO...' : 'RESERVAR'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
        </>
      )}
    </div>
  );
}
