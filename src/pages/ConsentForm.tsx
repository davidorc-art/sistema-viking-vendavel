import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Signature as SignatureIcon, 
  ShieldCheck, 
  User, 
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import SignaturePad from 'react-signature-pad-wrapper';
import { useData } from '../context/DataContext';
import { cn, toCamelCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Appointment, Professional } from '../types';
import { fetchTerms, ConsentTerm } from '../services/consentService';

const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cleanCPF.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cleanCPF.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;
  return true;
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function ConsentForm() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const idFromLocation = location.pathname.split('/')[2];
  const finalAppointmentId = appointmentId || idFromLocation;
  
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'Tattoo' | 'Piercing') || 'Tattoo';
  
  const { appointments, addConsentForm, clients, isSyncing, setAppointments, setClients, consentForms, professionals, setProfessionals, updateClient } = useData();
  
  const [appointment, setLocalAppointment] = useState<Appointment | undefined>(
    appointments.find(a => a.id === finalAppointmentId)
  );
  const [isLoading, setIsLoading] = useState(!appointment);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tattooTerms, setTattooTerms] = useState<string>('Carregando termos...');
  const [piercingTerms, setPiercingTerms] = useState<string>('Carregando termos...');

  const professional = useMemo(() => {
    if (appointment?.professionalId) {
      return professionals.find(p => p.id === appointment.professionalId);
    }
    
    if (type === 'Piercing') {
      return professionals.find(p => p.name.toLowerCase().includes('jeynne'));
    } else {
      return professionals.find(p => p.name.toLowerCase().includes('david'));
    }
  }, [professionals, type, appointment?.professionalId]);

  const [isLoadingProfessional, setIsLoadingProfessional] = useState(false);
  const [hasAttemptedFetchProf, setHasAttemptedFetchProf] = useState(false);

  // Fetch professional if missing or signature is missing
  useEffect(() => {
    if ((!professional || !professional.signature) && !isSyncing && !hasAttemptedFetchProf) {
      const fetchProfessional = async () => {
        setIsLoadingProfessional(true);
        setHasAttemptedFetchProf(true);
        try {
          let query = supabase.from('professionals').select('*');
          
          if (appointment?.professionalId) {
            query = query.eq('id', appointment.professionalId);
          } else {
            const nameToSearch = type === 'Piercing' ? 'jeynne' : 'david';
            query = query.ilike('name', `%${nameToSearch}%`).limit(1);
          }

          const { data, error } = await query.maybeSingle();
          
          console.log('ConsentForm: fetchProfessional result:', { data: !!data, error, id: data?.id, hasAssinatura: !!data?.assinatura, hasSignature: !!data?.signature });

          if (data) {
            // We need to use the sanitize function from DataContext, but since we don't have it exported directly,
            // we'll manually sanitize it here to ensure 'signature' is mapped correctly.
            const p = toCamelCase(data);
            const sanitizedProf: Professional = {
              id: String(p.id || ''),
              name: String(p.name || 'Sem Nome'),
              role: String(p.role || 'Profissional'),
              specialty: Array.isArray(p.specialty) ? p.specialty.map(String) : ['Geral'],
              rating: Number(p.rating || 5),
              status: (['Disponível', 'Em Atendimento', 'Ausente'].includes(p.status) ? p.status : 'Disponível') as any,
              avatar: String(p.avatar || ''),
              commission: Number(p.commission || 0),
              signature: String(p.signature || p.assinatura || '')
            };
            setProfessionals(prev => {
              const exists = prev.find(p => p.id === sanitizedProf.id);
              if (exists) {
                return prev.map(p => p.id === sanitizedProf.id ? { ...p, ...sanitizedProf } : p);
              }
              return [...prev, sanitizedProf];
            });
          }
        } catch (err) {
          console.error('ConsentForm: Error fetching professional:', err);
        } finally {
          setIsLoadingProfessional(false);
        }
      };
      fetchProfessional();
    }
  }, [appointment?.professionalId, professional, isSyncing, setProfessionals, type, hasAttemptedFetchProf]);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const terms = await fetchTerms();
        const tattoo = terms.find(t => t.id === 'tattoo');
        const piercing = terms.find(t => t.id === 'piercing');
        if (tattoo) setTattooTerms(tattoo.content);
        if (piercing) setPiercingTerms(piercing.content);
        else if (type === 'Piercing') {
          setPiercingTerms(`O procedimento de piercing consiste na perfuração de tecido corporal para inserção de joia.

1. RISCOS: Inchaço, vermelhidão, sangramento leve e desconforto são normais nos primeiros dias. Riscos incluem infecção, reações alérgicas ao metal, migração ou rejeição da joia e formação de cicatrizes hipertróficas ou queloides.

2. CUIDADOS: A limpeza deve ser feita conforme orientação, utilizando soro fisiológico. Não remover a joia antes da cicatrização total. Evitar piscinas, mar e exposição solar excessiva na área.

3. RESPONSABILIDADE: Declaro que as informações de saúde prestadas são verdadeiras e que seguirei todas as recomendações de pós-procedimento.`);
        }
      } catch (err) {
        console.error('Error loading terms:', err);
        setTattooTerms('Erro ao carregar termos.');
        setPiercingTerms('Erro ao carregar termos.');
      }
    };
    loadTerms();
  }, [type]);

  useEffect(() => {
    let isMounted = true;
    
    const syncAppointment = async () => {
      if (!finalAppointmentId) {
        setIsLoading(false);
        return;
      }

      // 1. Try to find in context
      const found = appointments.find(a => a.id === finalAppointmentId);
      if (found) {
        if (isMounted) {
          setLocalAppointment(found);
          setIsLoading(false);
        }
        return;
      }

      // 2. If not found and not syncing, try to fetch from Supabase
      if (!isSyncing) {
        try {
          if (isMounted) setIsLoading(true);
          console.log('ConsentForm: Fetching appointment from DB:', finalAppointmentId);
          
          // Try to fetch appointment directly
          let { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', finalAppointmentId)
            .maybeSingle();
            
          if (error) {
            console.error('ConsentForm: Error fetching appointment directly:', error);
          }

          // Fallback 1: If not found, check if it's a consent_form ID
          if (!data && finalAppointmentId) {
            console.log('ConsentForm: Appointment not found, checking consent_forms table...');
            const { data: consentData, error: consentError } = await supabase
              .from('consent_forms')
              .select('appointment_id')
              .eq('id', finalAppointmentId)
              .maybeSingle();
            
            if (consentError) {
              console.error('ConsentForm: Error checking consent_forms:', consentError);
            }

            if (consentData?.appointment_id) {
              console.log('ConsentForm: Found appointment_id from consent_form:', consentData.appointment_id);
              const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', consentData.appointment_id)
                .maybeSingle();
              
              if (apptError) {
                console.error('ConsentForm: Error fetching appointment via consent_form:', apptError);
              }
              data = apptData;
            }
          }

          // Fallback 2: If still not found, check if it's a client ID
          if (!data && finalAppointmentId) {
            console.log('ConsentForm: Still not found, checking if it is a client ID...');
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('id')
              .eq('id', finalAppointmentId)
              .maybeSingle();

            if (clientError) {
              console.error('ConsentForm: Error checking clients:', clientError);
            }

            if (clientData) {
              console.log('ConsentForm: ID is a client ID, fetching latest appointment...');
              const { data: latestAppt, error: latestError } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', finalAppointmentId)
                .order('date', { ascending: false })
                .order('time', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (latestError) {
                console.error('ConsentForm: Error fetching latest appointment for client:', latestError);
              }
              data = latestAppt;
            }
          }
            
          if (isMounted && data) {
            console.log('ConsentForm: Appointment found in DB:', data);
            // Manually sanitize to match DataContext logic
            const sanitizedAppt: Appointment = {
              id: String(data.id || ''),
              clientId: String(data.clientId || data.clientid || data.client_id || ''),
              clientName: String(data.clientName || data.clientname || data.client_name || data.nomeCliente || data.cliente || 'Cliente'),
              professionalId: String(data.professionalId || data.professionalid || data.professional_id || data.profissionalId || data.profissional_id || ''),
              professionalName: String(data.professionalName || data.professionalname || data.professional_name || data.nomeProfissional || data.profissional || 'Profissional'),
              service: String(data.service || data.servico || data.descricao_servico || data.descricao || 'Serviço'),
              date: String(data.date || data.data || data.dados || '').split('T')[0],
              time: String(data.time || data.hora || data.hora_inicio || '00:00').substring(0, 5),
              status: (['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'].includes(data.status) ? data.status : 
                       (data.status === 'concluido' ? 'Finalizado' : 'Confirmado')) as any,
              approvalStatus: (['Pendente', 'Aprovado', 'Reprovado'].includes(data.approvalStatus) ? data.approvalStatus : 'Pendente') as any,
              value: Number(data.value || data.valor || data.valor_total || data.total_value || 0),
              paidValue: Number(data.paidValue || data.valorPago || data.valor_pago || 0),
              duration: Number(data.duration || data.duracao || data.tempo || 60),
              consentSent: Boolean(data.consentSent || data.consent_sent),
              consentSigned: Boolean(data.consentSigned || data.consent_signed),
              consentData: toCamelCase(data.consentData || data.consent_data || null)
            };
            
            setLocalAppointment(sanitizedAppt);
            setAppointments(prev => {
              if (prev.find(a => a.id === sanitizedAppt.id)) return prev;
              return [...prev, sanitizedAppt];
            });
          } else if (isMounted) {
            console.error('ConsentForm: Appointment not found in DB:', error);
            if (error) {
              setFetchError(error.message || JSON.stringify(error));
            }
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('ConsentForm: Error fetching appointment:', err);
            setFetchError(err.message || JSON.stringify(err));
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    syncAppointment();
    return () => { isMounted = false; };
  }, [finalAppointmentId, appointments, isSyncing, setAppointments]);

  const client = clients.find(c => c.id === appointment?.clientId);

  // Fetch client if missing
  useEffect(() => {
    if (appointment?.clientId && !client && !isSyncing) {
      const fetchClient = async () => {
        try {
          const { data } = await supabase
            .from('clients')
            .select('*')
            .eq('id', appointment.clientId)
            .single();
          
          if (data) {
            const sanitizedClient = toCamelCase(data);
            setClients(prev => {
              if (prev.find(c => c.id === sanitizedClient.id)) return prev;
              return [...prev, sanitizedClient];
            });
          }
        } catch (err) {
          console.error('Error fetching client:', err);
        }
      };
      fetchClient();
    }
  }, [appointment?.clientId, client, isSyncing, setClients]);

  const [step, setStep] = useState(1);
  const [isMinor, setIsMinor] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sigCanvas = useRef<SignaturePad>(null);
  
  const questions = [
    { id: 'diabetes', label: 'Possui Diabetes?', type: 'boolean' },
    { id: 'hemophilia', label: 'Possui Hemofilia ou problemas de coagulação?', type: 'boolean' },
    { id: 'hepatitis', label: 'Possui Hepatite (B ou C)?', type: 'boolean' },
    { id: 'hiv', label: 'É portador de HIV?', type: 'boolean' },
    { id: 'pregnancy', label: 'Está grávida ou amamentando?', type: 'boolean' },
    { id: 'fainting', label: 'Tem tendência a desmaios ou tonturas?', type: 'boolean' },
    { id: 'epilepsy', label: 'Possui Epilepsia?', type: 'boolean' },
    { id: 'healingIssues', label: 'Tem problemas de cicatrização ou queloides?', type: 'boolean' },
    { id: 'heartConditions', label: 'Possui problemas cardíacos ou usa marca-passo?', type: 'boolean' },
    { id: 'alcoholDrugUse', label: 'Consumiu álcool ou drogas nas últimas 24 horas?', type: 'boolean' },
    { id: 'allergies', label: 'Possui alguma alergia (metais, pigmentos, látex, iodo)?', type: 'text' },
    { id: 'medications', label: 'Faz uso de algum medicamento contínuo (anticoagulantes, etc)?', type: 'text' },
    { id: 'skinConditions', label: 'Possui alguma condição de pele na área do procedimento?', type: 'text' },
    { id: 'otherConditions', label: 'Alguma outra condição de saúde relevante?', type: 'text' },
    ...(type === 'Piercing' ? [
      { id: 'piercingExperience', label: 'Experiência com Piercing', type: 'choice', options: ['Primeira vez', 'Já possui outros', 'Já teve problemas anteriormente'] },
      { id: 'metalSensitivity', label: 'Sensibilidade a Metais', type: 'choice', options: ['Nenhuma', 'Apenas bijuterias', 'Alergia severa (níquel/cobalto)'] },
      { id: 'aftercareCommitment', label: 'Comprometimento com Pós-operatório', type: 'choice', options: ['Estou ciente e seguirei à risca', 'Tenho dúvidas sobre a limpeza', 'Tenho dificuldade em seguir rotinas'] },
      { id: 'lifestyle', label: 'Atividades Físicas / Estilo de Vida', type: 'choice', options: ['Sedentário', 'Atividades leves', 'Esportes de contato / Piscina frequente'] },
      { id: 'foodIntake', label: 'Alimentou-se nas últimas 4 horas?', type: 'boolean' },
      { id: 'jewelryChange', label: 'Ciente que a joia não deve ser trocada antes da cicatrização total?', type: 'boolean' },
      { id: 'localAnesthesia', label: 'Deseja uso de anestésico tópico (se disponível)?', type: 'boolean' }
    ] : [])
  ];
  
  const [formData, setFormData] = useState({
    clientCpf: '',
    clientBirthDate: '',
    guardianName: '',
    guardianDoc: '',
    guardianBirthDate: '',
    guardianPhoto: '',
    guardianFacePhoto: '',
    minorPhoto: '',
    signature: '',
    answers: {
      diabetes: false,
      hemophilia: false,
      hepatitis: false,
      hiv: false,
      pregnancy: false,
      allergies: '',
      medications: '',
      skinConditions: '',
      fainting: false,
      epilepsy: false,
      healingIssues: false,
      alcoholDrugUse: false,
      heartConditions: false,
      otherConditions: ''
    }
  });

  useEffect(() => {
    if (formData.clientBirthDate) {
      const age = calculateAge(formData.clientBirthDate);
      setIsMinor(age < 18 && age >= 0);
    }
  }, [formData.clientBirthDate]);

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientCpf: client.cpf || prev.clientCpf,
        clientBirthDate: client.birthDate || prev.clientBirthDate
      }));
    }
  }, [client]);

  const isPrintMode = searchParams.get('print') === 'true';

  useEffect(() => {
    const hasValidProfessional = !!professional && (!!professional.signature || hasAttemptedFetchProf);
    const canPrint = !isLoadingProfessional && !isSyncing && (hasValidProfessional || hasAttemptedFetchProf);
    if (isPrintMode && appointment?.consentSigned && canPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPrintMode, appointment?.consentSigned, isLoadingProfessional, isSyncing, professional, hasAttemptedFetchProf]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="font-serif italic">Consultando as crônicas de Valhalla...</p>
      </div>
    );
  }

  // Se já estiver assinado, mostra o termo (mesmo que não seja modo impressão, para o "Visualizar" da agenda)
  if (appointment?.consentSigned && (isPrintMode || !success)) {
    let rawData: any = {};
    if (typeof appointment.consentData === 'string') {
      try {
        rawData = JSON.parse(appointment.consentData);
      } catch (e) {
        console.error('Failed to parse consentData:', e);
      }
    } else {
      rawData = appointment.consentData || {};
    }
      
    let answers: any = {};
    if (typeof rawData?.answers === 'string') {
      try {
        answers = JSON.parse(rawData.answers);
      } catch (e) {
        console.error('Failed to parse rawData.answers:', e);
      }
    } else {
      answers = rawData?.answers || {};
    }

    const data = {
      ...rawData,
      answers,
      clientCpf: rawData?.clientCpf || rawData?.client_cpf || answers?.client_cpf || answers?.clientCpf || client?.cpf,
      clientBirthDate: rawData?.clientBirthDate || rawData?.client_birth_date || answers?.client_birth_date || answers?.clientBirthDate || client?.birthDate,
      guardianName: rawData?.guardianName || rawData?.guardian_name || answers?.guardian_name || answers?.guardianName,
      guardianDoc: rawData?.guardianDoc || rawData?.guardian_doc || answers?.guardian_doc || answers?.guardianDoc,
      guardianBirthDate: rawData?.guardianBirthDate || rawData?.guardian_birth_date || answers?.guardian_birth_date || answers?.guardianBirthDate,
      guardianPhoto: rawData?.guardianPhoto || rawData?.guardian_photo || answers?.guardian_photo || answers?.guardianPhoto,
      guardianFacePhoto: rawData?.guardianFacePhoto || rawData?.guardian_face_photo || answers?.guardian_face_photo || answers?.guardianFacePhoto,
      minorPhoto: rawData?.minorPhoto || rawData?.minor_photo || answers?.minor_photo || answers?.minorPhoto,
      professionalSignature: rawData?.professionalSignature || rawData?.professional_signature || answers?.professional_signature || answers?.professionalSignature || professional?.signature,
      signedAt: rawData?.signedAt || rawData?.signed_at,
    };
    
    console.log('ConsentForm Printable View Debug:', {
      professionalId: appointment?.professionalId,
      professionalFound: !!professional,
      professionalName: professional?.name,
      professionalSignatureLength: professional?.signature?.length,
      dataProfessionalSignatureLength: data?.professionalSignature?.length,
      rawDataProfessionalSignature: rawData?.professionalSignature,
      rawDataProfessional_signature: rawData?.professional_signature
    });
      
    return (
      <div className="min-h-screen bg-white text-black p-8 md:p-16 max-w-4xl mx-auto font-serif">
        <div className="text-center mb-12 border-b-2 border-black pb-8">
          <h1 className="text-3xl font-bold uppercase mb-2">Termo de Consentimento</h1>
          <p className="text-sm text-gray-600 italic">Procedimento de {data?.type === 'Tattoo' ? 'Tatuagem' : 'Perfuração'}</p>
        </div>

        <div className="space-y-8 text-justify leading-relaxed">
          <section>
            <h2 className="font-bold border-b border-black mb-4">1. TERMOS LEGAIS E ORIENTAÇÕES</h2>
            <p className="whitespace-pre-line text-sm">
              {data?.type === 'Tattoo' ? tattooTerms : piercingTerms}
            </p>
          </section>

          <section>
            <h2 className="font-bold border-b border-black mb-4">2. DADOS DO CLIENTE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-8">
              <p><strong>Nome:</strong> {appointment.clientName}</p>
              <p><strong>CPF:</strong> {data?.clientCpf || 'Não informado'}</p>
              <p><strong>Data de Nascimento:</strong> {data?.clientBirthDate ? new Date(data.clientBirthDate).toLocaleDateString('pt-BR') : 'Não informada'}</p>
            </div>

            <h2 className="font-bold border-b border-black mb-4">3. QUESTIONÁRIO DE SAÚDE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {questions.map(q => (
                <div key={q.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-medium">{q.label}</span>
                  <span className="font-bold">
                    {q.type === 'boolean' 
                      ? (data?.answers?.[q.id] ? 'SIM' : 'NÃO') 
                      : (data?.answers?.[q.id] || 'N/A')}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {data?.guardianName && (
            <section className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="font-bold mb-2">DADOS DO RESPONSÁVEL (MENOR DE IDADE)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p><strong>Nome:</strong> {data?.guardianName}</p>
                <p><strong>Documento (CPF/RG):</strong> {data?.guardianDoc}</p>
                {data?.guardianBirthDate && (
                  <p><strong>Data de Nascimento:</strong> {new Date(data.guardianBirthDate).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </section>
          )}

          <div className="mt-16 pt-8 border-t-2 border-black grid grid-cols-2 gap-12">
            <div className="text-center space-y-4">
              <p className="text-xs font-bold uppercase">Assinatura do {data?.guardianName ? 'Responsável' : 'Cliente'}</p>
              <img src={data?.signature} alt="Assinatura" className="max-h-24 mx-auto" />
              <div className="border-t border-black pt-2">
                <p className="text-sm font-bold">{data?.guardianName || appointment.clientName}</p>
                <p className="text-[10px] text-gray-500">
                  CPF: {data?.guardianName ? data?.guardianDoc : (data?.clientCpf || 'Não informado')}
                </p>
                <p className="text-[10px] text-gray-500">
                  Nasc: {data?.guardianName 
                    ? (data?.guardianBirthDate ? new Date(data.guardianBirthDate).toLocaleDateString('pt-BR') : 'Não informada')
                    : (data?.clientBirthDate ? new Date(data.clientBirthDate).toLocaleDateString('pt-BR') : 'Não informada')}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Assinado em: {new Date(data?.signedAt || '').toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="text-center space-y-4 flex flex-col justify-end">
              {((data?.professionalSignature && data.professionalSignature.length > 50) || (professional?.signature && professional.signature.length > 50)) && (
                <img src={data?.professionalSignature?.length > 50 ? data.professionalSignature : professional?.signature} alt="Assinatura Profissional" className="max-h-24 mx-auto" />
              )}
              <div className="border-t border-black pt-2">
                <p className="text-sm font-bold">{professional?.name || appointment.professionalName}</p>
                <p className="text-[10px] text-gray-500">Profissional Responsável</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center no-print">
          <button 
            onClick={() => window.print()}
            className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
          >
            <FileText size={20} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8 text-center font-serif italic">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold">Agendamento não encontrado</h2>
          <p className="text-gray-400">Não conseguimos localizar este agendamento nas crônicas de Valhalla.</p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Detalhes do Erro</p>
            <p className="text-xs font-mono break-all text-gray-300">ID: {finalAppointmentId}</p>
            {fetchError && (
              <p className="text-xs font-mono break-all text-red-400 mt-2">Erro Supabase: {fetchError}</p>
            )}
            {!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder') ? (
              <p className="text-xs text-red-400 font-bold mt-2">
                Aviso: O banco de dados (Supabase) não está configurado. O link só funcionará no mesmo dispositivo onde o agendamento foi criado.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-500 italic">Verifique se o link está correto ou se o agendamento ainda existe.</p>
                <p className="text-[10px] text-yellow-500/80">
                  Dica para o estúdio: Se o cliente não consegue acessar, verifique se as políticas de segurança (RLS) do Supabase permitem leitura pública (anon) nas tabelas 'appointments', 'clients' e 'professionals', ou se o agendamento foi sincronizado corretamente.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Tentar Novamente
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'guardianPhoto' | 'guardianFacePhoto' | 'minorPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension
          const MAX_DIMENSION = 800;
          
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.6 quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            setFormData(prev => ({ ...prev, [field]: compressedDataUrl }));
          } else {
            // Fallback if canvas fails
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
          }
        };
        img.onerror = () => {
          console.error('Failed to load image. It might be an unsupported format like HEIC.');
          alert('Não foi possível carregar a imagem. Por favor, tente usar uma foto em formato JPG ou PNG.');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const newErrors: string[] = [];
    
    if (!formData.clientCpf) {
      newErrors.push('O CPF do cliente é obrigatório.');
    } else if (!validateCPF(formData.clientCpf)) {
      newErrors.push('O CPF informado é inválido.');
    }

    if (!formData.clientBirthDate) {
      newErrors.push('A data de nascimento do cliente é obrigatória.');
    } else {
      const age = calculateAge(formData.clientBirthDate);
      if (age < 0 || age > 120) {
        newErrors.push('Data de nascimento inválida.');
      }
    }

    if (isMinor) {
      if (!formData.guardianName) newErrors.push('O nome do responsável é obrigatório.');
      if (!formData.guardianDoc) newErrors.push('O documento do responsável é obrigatório.');
      if (!formData.guardianBirthDate) newErrors.push('A data de nascimento do responsável é obrigatória.');
      if (!formData.guardianPhoto) newErrors.push('A foto do documento do responsável é obrigatória.');
      if (!formData.guardianFacePhoto) newErrors.push('A selfie do responsável é obrigatória.');
      if (!formData.minorPhoto) newErrors.push('A selfie do menor é obrigatória.');
    }

    if (sigCanvas.current?.isEmpty()) {
      newErrors.push('A assinatura é obrigatória.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      const scrollContainer = document.querySelector('.custom-scrollbar');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    
    try {
      console.log('Saving consent for appointment:', appointment.id);
      const signature = sigCanvas.current?.toDataURL('image/png') || '';
      
      const consentData = {
        type,
        signedAt: new Date().toISOString(),
        signature,
        professionalSignature: professional?.signature,
        clientCpf: formData.clientCpf,
        clientBirthDate: formData.clientBirthDate,
        guardianName: isMinor ? formData.guardianName : undefined,
        guardianDoc: isMinor ? formData.guardianDoc : undefined,
        guardianBirthDate: isMinor ? formData.guardianBirthDate : undefined,
        guardianPhoto: isMinor ? formData.guardianPhoto : undefined,
        guardianFacePhoto: isMinor ? formData.guardianFacePhoto : undefined,
        minorPhoto: isMinor ? formData.minorPhoto : undefined,
        answers: formData.answers
      };

      console.log('Consent data payload:', consentData);

      await addConsentForm({
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        type: consentData.type,
        signedAt: consentData.signedAt,
        signature: consentData.signature,
        professionalSignature: professional?.signature,
        clientCpf: consentData.clientCpf,
        clientBirthDate: consentData.clientBirthDate,
        guardianName: consentData.guardianName,
        guardianDoc: consentData.guardianDoc,
        guardianBirthDate: consentData.guardianBirthDate,
        guardianPhoto: consentData.guardianPhoto,
        guardianFacePhoto: consentData.guardianFacePhoto,
        minorPhoto: consentData.minorPhoto,
        answers: consentData.answers
      });
      
      // Update client profile with CPF and Birth Date if missing
      if (client && (!client.cpf || !client.birthDate)) {
        try {
          await updateClient(client.id, {
            cpf: consentData.clientCpf,
            birthDate: consentData.clientBirthDate
          });
          console.log('Client profile updated with CPF and Birth Date');
        } catch (err) {
          console.error('Error updating client profile:', err);
        }
      }
      
      console.log('Consent saved successfully');
      setSuccess(true);
    } catch (error: any) {
      console.error('Error saving consent:', error);
      setErrors([`Erro ao salvar o termo: ${error.message || 'Erro desconhecido'}. Tente novamente.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0d8d0] p-4 md:p-8 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#151619] border border-[#3a3a3a] rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif italic text-[#c5a059]">Termo de Consentimento</h1>
              <p className="text-xs text-[#8e9299] uppercase tracking-widest">{type === 'Tattoo' ? 'Procedimento de Tatuagem' : 'Procedimento de Perfuração'}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            {(isMinor ? [1, 2, 3, 4] : [1, 2, 3]).map(s => (
              <div key={s} className={cn(
                "h-1 flex-1 rounded-full transition-all",
                step >= s ? "bg-primary" : "bg-white/10"
              )} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
              <button onClick={() => setErrors([])} className="ml-auto hover:opacity-70">
                <X size={16} />
              </button>
            </div>
          )}

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Termo Assinado com Sucesso!</h2>
              <p className="text-[#8e9299] mb-8">Obrigado por sua colaboração. O profissional já foi notificado.</p>
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-left space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Resumo do Agendamento</p>
                  <p className="text-lg font-bold text-white">{appointment.clientName}</p>
                  <p className="text-sm text-primary">{appointment.service}</p>
                  <p className="text-sm text-gray-400">{new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}</p>
                </div>

                {professional?.signature && professional.signature.length > 50 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Assinado pelo Profissional</span>
                      <span className="text-[10px] text-gray-500 italic">{professional.name}</span>
                    </div>
                    <div className="bg-white/90 rounded-xl p-2 flex items-center justify-center h-16">
                      <img src={professional.signature} alt="Assinatura Profissional" className="max-h-full object-contain" />
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    const getConsentType = (appointment: any) => {
                      if (!appointment.consentData) return appointment.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo';
                      const data = typeof appointment.consentData === 'string' ? JSON.parse(appointment.consentData) : appointment.consentData;
                      return data.type || (appointment.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo');
                    };
                    const type = getConsentType(appointment);
                    window.open(`/consent/${appointment.id}?type=${type}&print=true`, '_blank');
                  }}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <FileText size={20} /> Baixar Cópia do Termo (PDF)
                </button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <AlertCircle className="text-primary" size={20} />
                    <p className="text-sm text-primary font-medium">Por favor, leia atentamente os termos jurídicos e de saúde.</p>
                  </div>
                  
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-[#c5a059] mb-2">
                      <FileText size={18} />
                      <h3 className="font-bold uppercase tracking-widest text-xs">Termos Legais (ANVISA)</h3>
                    </div>
                    <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line font-serif italic">
                      {type === 'Tattoo' ? tattooTerms : piercingTerms}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                    <input 
                      type="checkbox" 
                      id="isMinor" 
                      checked={isMinor}
                      disabled
                      className="w-5 h-5 rounded border-white/10 bg-black text-primary focus:ring-primary cursor-not-allowed"
                    />
                    <label htmlFor="isMinor" className="text-sm font-bold text-gray-300 cursor-not-allowed uppercase tracking-widest">
                      Sou menor de idade {isMinor ? '(Detectado pela data)' : ''}
                    </label>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-primary rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                  >
                    <SignatureIcon size={20} /> Assinar Agora
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertCircle size={20} className="text-primary" />
                    Questionário de Saúde
                  </h3>
                  <div className="space-y-4">
                    {questions.map(q => (
                      <div key={q.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                        <label className="text-sm font-medium text-gray-300 block">{q.label}</label>
                        {q.type === 'boolean' ? (
                          <div className="flex gap-4">
                            <button 
                              type="button"
                              onClick={() => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: true } })}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                                (formData.answers as any)[q.id] === true ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-gray-500"
                              )}
                            >
                              Sim
                            </button>
                            <button 
                              type="button"
                              onClick={() => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: false } })}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                                (formData.answers as any)[q.id] === false ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-gray-500"
                              )}
                            >
                              Não
                            </button>
                          </div>
                        ) : q.type === 'choice' ? (
                          <div className="grid grid-cols-1 gap-2">
                            {q.options?.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: opt } })}
                                className={cn(
                                  "w-full py-3 px-4 rounded-xl text-xs font-bold text-left transition-all border",
                                  (formData.answers as any)[q.id] === opt ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            value={(formData.answers as any)[q.id]}
                            onChange={e => setFormData({ ...formData, answers: { ...formData.answers, [q.id]: e.target.value } })}
                            placeholder="Descreva aqui..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-primary/50 outline-none h-20 resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && isMinor && (
                <motion.div 
                  key="step3-minor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    Dados do Responsável
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nome do Responsável</label>
                      <input 
                        type="text" 
                        value={formData.guardianName}
                        onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CPF / RG do Responsável</label>
                        <input 
                          type="text" 
                          value={formData.guardianDoc}
                          onChange={e => setFormData({ ...formData, guardianDoc: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento (Resp.)</label>
                        <input 
                          type="date" 
                          value={formData.guardianBirthDate}
                          onChange={e => setFormData({ ...formData, guardianBirthDate: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Foto do Documento (Responsável)</label>
                        <div className="relative aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden">
                          {formData.guardianPhoto ? (
                            <>
                              <img src={formData.guardianPhoto} alt="Doc" className="w-full h-full object-cover" />
                              <button onClick={() => setFormData({...formData, guardianPhoto: ''})} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <Camera className="text-gray-500" size={32} />
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Tirar Foto</span>
                              <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'guardianPhoto')} />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Foto do Rosto (Responsável)</label>
                        <div className="relative aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden">
                          {formData.guardianFacePhoto ? (
                            <>
                              <img src={formData.guardianFacePhoto} alt="Face" className="w-full h-full object-cover" />
                              <button onClick={() => setFormData({...formData, guardianFacePhoto: ''})} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <Camera className="text-gray-500" size={32} />
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Selfie Responsável</span>
                              <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'guardianFacePhoto')} />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Foto do Rosto (Menor)</label>
                        <div className="relative aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden">
                          {formData.minorPhoto ? (
                            <>
                              <img src={formData.minorPhoto} alt="Minor" className="w-full h-full object-cover" />
                              <button onClick={() => setFormData({...formData, minorPhoto: ''})} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <Camera className="text-gray-500" size={32} />
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Selfie Menor</span>
                              <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'minorPhoto')} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {(step === 4 || (step === 3 && !isMinor)) && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <SignatureIcon size={20} className="text-primary" />
                    Assinatura Digital
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">CPF do Cliente</label>
                      <input
                        type="text"
                        value={formData.clientCpf}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 11) {
                            val = val.replace(/(\d{3})(\d)/, '$1.$2');
                            val = val.replace(/(\d{3})(\d)/, '$1.$2');
                            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                          }
                          setFormData({ ...formData, clientCpf: val });
                        }}
                        placeholder="000.000.000-00"
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={formData.clientBirthDate}
                        onChange={(e) => setFormData({ ...formData, clientBirthDate: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 italic">Assine dentro do quadro abaixo utilizando o dedo ou caneta touch.</p>

                  {professional?.signature && professional.signature.length > 50 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Assinatura do Profissional</span>
                        <span className="text-[10px] text-gray-500 italic">{professional.name}</span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-2 flex items-center justify-center h-24">
                        <img src={professional.signature} alt="Assinatura Profissional" className="max-h-full object-contain" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className={cn("bg-white rounded-3xl overflow-hidden border-4 border-primary/20", (step === 4 || (step === 3 && !isMinor)) ? "block" : "hidden")}>
                <SignaturePad 
                  ref={sigCanvas}
                  options={{
                    penColor: "black"
                  }}
                  canvasProps={{
                    className: "w-full h-64",
                    style: { width: '100%', height: '256px' }
                  }}
                />
              </div>
              
              <div className={(step === 4 || (step === 3 && !isMinor)) ? "block" : "hidden"}>
                <button 
                  type="button"
                  onClick={() => sigCanvas.current?.clear()}
                  className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Limpar Assinatura
                </button>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Ao assinar, declaro que li e compreendi todos os termos, que as informações de saúde são verídicas e que assumo total responsabilidade pelo procedimento solicitado.
                  </p>
                </div>
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-8 border-t border-white/5 bg-black/20 flex gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(prev => prev - 1)}
                className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                disabled={isSubmitting}
              >
                <ChevronLeft size={20} /> Voltar
              </button>
            )}
            <button 
              onClick={() => {
                const maxStep = isMinor ? 4 : 3;
                if (step < maxStep) {
                  setStep(prev => prev + 1);
                } else {
                  handleSave();
                }
              }}
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-primary rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {step < (isMinor ? 4 : 3) ? (
                <>Próximo <ChevronRight size={20} /></>
              ) : (
                <>{isSubmitting ? 'Salvando...' : 'Finalizar e Assinar'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
