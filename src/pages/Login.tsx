import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, ShieldCheck, AlertCircle, Loader2, CreditCard, User, Phone, CheckCircle2, X, Instagram, MapPin, Calendar, HeartPulse, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { RuneBackground } from '../components/RuneBackground';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { clientLogin } = useAuth();
  const { clients, addClient } = useData();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'professional' | 'client'>('client');
  const [showRegistration, setShowRegistration] = useState(false);
  const isMounted = React.useRef(true);

  // Registration states
  const [regData, setRegData] = useState({
    name: '',
    phone: '',
    cpf: '',
    email: '',
    instagram: '',
    birthDate: '',
    city: '',
    medicalNotes: '',
    indicatedBy: '',
    isMinor: false
  });

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (loginMode === 'professional') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (isMounted.current) {
          toast.success('Login realizado com sucesso!');
        }
      } else {
        // Client Login via CPF
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length < 11) {
           throw new Error('Por favor, informe seu CPF completo.');
        }

        const formattedCpf = formatCPF(cleanCpf);
        
        // Search by exact CPF (both clean and formatted) and also use a more flexible ILIKE search
        const { data: dbClients, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf},cpf.ilike.%${cleanCpf}%`);
        
        if (fetchError) {
          console.error('Error fetching client:', fetchError);
        }

        let foundClient = dbClients && dbClients.length > 0 ? dbClients[0] : null;

        // Fallback to locally synced clients
        if (!foundClient) {
          foundClient = clients.find(c => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
        }

        if (foundClient) {
          clientLogin({
            id: foundClient.id,
            name: foundClient.name,
            cpf: foundClient.cpf || ''
          });
          toast.success(`Seja bem-vindo, ${foundClient.name.split(' ')[0]}!`);
          navigate('/portal/');
        } else {
          throw new Error('CPF não encontrado em nosso reino. Por favor, cadastre-se ou verifique os dados.');
        }
      }
    } catch (err: any) {
      const errMsg = err.message || 'Ocorreu um erro na autenticação.';
      
      // Auto-fix for common Supabase refresh token corruption
      if (errMsg.includes('Refresh Token') || errMsg.includes('refresh_token_not_found') || errMsg.includes('Invalid Refresh Token')) {
        await supabase.auth.signOut();
      }

      if (isMounted.current) {
        setError(errMsg.includes('Refresh Token') ? 'A sessão estava expirada e foi limpa. Por favor, tente novamente.' : errMsg);
        toast.error(errMsg.includes('Refresh Token') ? 'Sessão limpa.' : errMsg);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!regData.name || !regData.phone || !regData.cpf || !regData.birthDate || !regData.city || !regData.instagram) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }

      const cleanCpf = regData.cpf.replace(/\D/g, '');
      const cleanPhone = regData.phone.replace(/\D/g, '');
      
      // Check for existing client by CPF or Phone in DB
      const { data: existingData } = await supabase
        .from('clients')
        .select('id')
        .or(`cpf.ilike.%${cleanCpf}%,phone.ilike.%${cleanPhone}%`);

      if (existingData && existingData.length > 0) {
        throw new Error('Este cadastro (CPF ou Telefone) já está em nossa guarda. Tente entrar diretamente.');
      }

      const birthDate = parseDate(regData.birthDate);
      if (!birthDate) throw new Error('Data de nascimento inválida.');

      const newClient = {
        name: regData.name,
        phone: regData.phone,
        cpf: regData.cpf,
        email: regData.email,
        instagram: regData.instagram,
        birthDate: birthDate,
        city: regData.city,
        medicalNotes: regData.medicalNotes || 'Nenhuma',
        indicatedBy: regData.indicatedBy || 'Ninguém',
        isMinor: regData.isMinor,
        status: 'Ativo' as const,
        points: 0,
        totalSpent: 0,
        level: 'Bronze' as const,
        createdAt: new Date().toISOString()
      };

      const result = await addClient(newClient);
      
      if (result) {
        clientLogin({
          id: result,
          name: newClient.name,
          cpf: newClient.cpf || ''
        });
        toast.success(`Bem-vindo ao reino, ${newClient.name.split(' ')[0]}!`);
        setShowRegistration(false);
        navigate('/portal/');
      }

    } catch (err: any) {
      toast.error(err.message || 'Falha ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
      <RuneBackground />
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
          {/* Logo/Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(249,115,22,0.2)] bg-black"
            >
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <User size={48} className="text-primary" />
              </div>
            </motion.div>
            <div className="p-4 bg-primary/20 text-primary rounded-3xl border border-primary/20">
              <ShieldCheck size={48} />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-serif italic font-bold text-white uppercase tracking-tight">
                Viking Tatuagem e Body piercing
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Tattoo & Piercing Profissional
              </p>
            </div>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-8">
            <button 
              onClick={() => { setLoginMode('client'); setError(null); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                loginMode === 'client' ? "bg-primary text-white shadow-lg scale-[1.02]" : "text-gray-500 hover:text-white"
              )}
            >
              Portal do Cliente
            </button>
            <button 
              onClick={() => { setLoginMode('professional'); setError(null); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                loginMode === 'professional' ? "bg-primary text-white shadow-lg scale-[1.02]" : "text-gray-500 hover:text-white"
              )}
            >
              Profissional
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {loginMode === 'professional' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Número do CPF</label>
                <div className="relative group">
                  <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-gray-600 ml-4 font-medium italic">Acesse seu histórico, fidelidade e agendamentos.</p>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-xs"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-xs"
              >
                <ShieldCheck size={16} />
                <span>{message}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  {loginMode === 'professional' ? 'Entrar' : 'Acessar Portal'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            {loginMode === 'client' && (
              <button 
                onClick={() => setShowRegistration(true)}
                className="text-xs text-gray-500 hover:text-primary transition-colors font-bold uppercase tracking-widest"
              >
                Ainda não sou cliente? Cadastrar Agora
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; 2026 Viking Tatuagem e Body piercing
        </p>
      </motion.div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegistration && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60]"
              onClick={() => !loading && setShowRegistration(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed z-[70] w-full max-w-lg p-6"
            >
              <div className="bg-card border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <button 
                  onClick={() => setShowRegistration(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
                >
                  <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 mb-4">
                   <div className="p-4 bg-primary/20 text-primary rounded-3xl border border-primary/20">
                    <User size={32} />
                  </div>
                  <h2 className="text-2xl font-bold italic uppercase">Recrutamento Viking</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Entre para nossa guarda e ganhe benefícios</p>
                </div>

                <form onSubmit={handleRegisterClient} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Nome Completo *</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">CPF *</label>
                      <div className="relative group">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={regData.cpf}
                          onChange={(e) => setRegData({ ...regData, cpf: formatCPF(e.target.value) })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">WhatsApp *</label>
                      <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={regData.phone}
                          onChange={(e) => setRegData({ ...regData, phone: formatPhone(e.target.value) })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Nascimento *</label>
                      <div className="relative group">
                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={regData.birthDate}
                          onChange={(e) => setRegData({ ...regData, birthDate: formatDate(e.target.value) })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Instagram *</label>
                      <div className="relative group">
                        <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={regData.instagram}
                          onChange={(e) => setRegData({ ...regData, instagram: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="@seu_instagram"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Cidade *</label>
                      <div className="relative group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          value={regData.city}
                          onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="Cidade/UF"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Indicado por (Opcional)</label>
                      <div className="relative group">
                        <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          value={regData.indicatedBy}
                          onChange={(e) => setRegData({ ...regData, indicatedBy: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="Quem te indicou?"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Observações Médicas / Alergias</label>
                    <div className="relative group">
                      <HeartPulse className="absolute left-6 top-6 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                      <textarea 
                        value={regData.medicalNotes}
                        onChange={(e) => setRegData({ ...regData, medicalNotes: e.target.value })}
                        rows={2}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 outline-none transition-all resize-none"
                        placeholder="Ex: Alergia a iodo, problemas de cicatrização, etc."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 py-2">
                    <input 
                      type="checkbox"
                      id="isMinor"
                      checked={regData.isMinor}
                      onChange={(e) => setRegData({ ...regData, isMinor: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-black/40 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="isMinor" className="text-xs text-gray-400 font-bold uppercase tracking-widest cursor-pointer">
                      Sou menor de 18 anos
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-primary text-white rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4 shrink-0"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                    {loading ? 'PROCESSANDO...' : 'JUNTE-SE À GUARDA'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
