import React, { useState, useRef } from 'react';
import { 
  Plus, 
  User, 
  Star, 
  Clock, 
  Calendar, 
  MoreVertical, 
  ChevronRight,
  MessageCircle,
  Scissors,
  Award,
  TrendingUp,
  X,
  Edit3,
  Trash2,
  Signature as SignatureIcon,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Professional } from '../types';
import SignaturePad from 'react-signature-pad-wrapper';

// --- Sub-components ---

const ProfessionalModal = ({ 
  professional, 
  isOpen, 
  onClose, 
  appointmentsToday,
  onDelete,
  onSave
}: { 
  professional: Professional | null, 
  isOpen: boolean, 
  onClose: () => void, 
  appointmentsToday: number,
  onDelete: (id: string) => Promise<void>,
  onSave: (prof: Partial<Professional>) => Promise<void>
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Professional>>({});
  const [error, setError] = useState<string | null>(null);
  const sigPad = useRef<SignaturePad>(null);

  React.useEffect(() => {
    setError(null);
    if (professional) {
      setFormData(professional);
    } else {
      setFormData({
        name: '',
        role: 'Tatuador',
        specialty: [],
        rating: 5.0,
        status: 'Disponível',
        commission: 30,
        signature: ''
      });
    }
    setIsEditing(!professional);
    setShowDeleteConfirm(false);
  }, [professional, isOpen]);

  if (!isOpen) return null;

  const clearSignature = () => {
    sigPad.current?.clear();
    setFormData({ ...formData, signature: '' });
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) return;
    const signatureData = sigPad.current?.toDataURL('image/png');
    setFormData({ ...formData, signature: signatureData });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    let signature = formData.signature;
    // If sigPad is not empty, save it before submitting
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signature = sigPad.current.toDataURL('image/png');
    }

    if (!signature) {
      setError('A assinatura do profissional é obrigatória.');
      return;
    }

    try {
      await onSave({ ...formData, signature });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar profissional. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (professional?.id) {
      try {
        await onDelete(professional.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Erro ao remover profissional.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">{professional ? (isEditing ? 'Editar Profissional' : 'Perfil do Profissional') : 'Novo Profissional'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nome Completo</label>
                    <input 
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Cargo</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                    >
                      <option value="Tatuador">Tatuador</option>
                      <option value="Piercer">Piercer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Especialidades (separadas por vírgula)</label>
                    <input 
                      type="text"
                      value={formData.specialty?.join(', ') || ''}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Comissão (%)</label>
                      <input 
                        type="number"
                        value={isNaN(formData.commission) ? '' : formData.commission}
                        onChange={e => setFormData({ ...formData, commission: Number(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      >
                        <option value="Disponível">Disponível</option>
                        <option value="Em Atendimento">Em Atendimento</option>
                        <option value="Ausente">Ausente</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <h3 className="text-sm font-bold italic uppercase tracking-tight">Dados Bancários / PIX</h3>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Configure para que este profissional possa receber link de pagamento direto</p>
                    
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Chave Pix</label>
                      <input 
                        type="text"
                        value={formData.pixKey || ''}
                        onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                        placeholder="CPF, CNPJ, Celular, Email ou Aleatória"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nome Pix</label>
                        <input 
                          type="text"
                          value={formData.pixName || ''}
                          onChange={e => setFormData({ ...formData, pixName: e.target.value })}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Cidade</label>
                        <input 
                          type="text"
                          value={formData.city || ''}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Ex: Sao Paulo"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block font-bold text-primary">InfinitePay TAG</label>
                      <input 
                        type="text"
                        value={formData.infinitePayTag || ''}
                        onChange={e => setFormData({ ...formData, infinitePayTag: e.target.value })}
                        placeholder="TAG personalizada InfinitePay"
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Assinatura do Profissional</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                      {formData.signature ? (
                        <div className="relative">
                          <img 
                            src={formData.signature} 
                            alt="Assinatura" 
                            className="max-h-32 mx-auto bg-white rounded-lg p-2"
                          />
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, signature: '' })}
                            className="absolute -top-2 -right-2 p-1.5 bg-destructive text-white rounded-full shadow-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white rounded-xl overflow-hidden">
                            <SignaturePad 
                              ref={sigPad}
                              options={{
                                penColor: "black"
                              }}
                              canvasProps={{
                                className: "w-full h-32 cursor-crosshair"
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button 
                              type="button"
                              onClick={clearSignature}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                              <RotateCcw size={12} /> Limpar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => professional ? setIsEditing(false) : onClose()}
                    className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/20">
                    <User size={40} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{professional?.name}</h3>
                    <p className="text-primary font-medium">{professional?.role}</p>
                    <div className="flex items-center gap-1 text-yellow-500 mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold">{professional?.rating}</span>
                      <span className="text-xs text-gray-500 font-normal">(128 avaliações)</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Hoje</span>
                    </div>
                    <p className="text-2xl font-bold">{appointmentsToday} Agend.</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <TrendingUp size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Comissão</span>
                    </div>
                    <p className="text-2xl font-bold text-success">{professional?.commission}%</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {professional?.specialty.map(s => (
                      <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Signature */}
                {professional?.signature && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assinatura</p>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-center">
                      <img 
                        src={professional.signature} 
                        alt="Assinatura do Profissional" 
                        className="max-h-24 bg-white rounded-lg p-2"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Edit3 size={18} /> Editar
                  </button>
                  <button 
                    onClick={() => { navigate('/agenda'); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Clock size={18} /> Horários
                  </button>
                  
                  {showDeleteConfirm ? (
                    <div className="col-span-2 space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <p className="text-xs font-bold text-destructive text-center uppercase tracking-widest">Confirmar remoção?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleDelete}
                          className="py-2 bg-destructive text-white rounded-xl text-xs font-bold hover:bg-destructive/80 transition-colors"
                        >
                          Sim, Remover
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 size={18} /> Remover da Equipe
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Profissionais() {
  const { professionals, appointments, addProfessional, updateProfessional, deleteProfessional } = useData();
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAppointmentsToday = (profId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.professionalId === profId && a.date === today).length;
  };

  const handleSave = async (data: Partial<Professional>) => {
    try {
      if (selectedProf) {
        await updateProfessional(selectedProf.id, data);
      } else {
        await addProfessional(data as Omit<Professional, 'id'>);
      }
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-serif italic text-primary">EQUIPE</h1>
          <p className="text-gray-500 text-sm font-medium">Gerencie seus profissionais e talentos</p>
        </div>
        <button 
          onClick={() => {
            setSelectedProf(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Novo Profissional
        </button>
      </div>

      {/* Professionals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {professionals.map((prof) => (
          <div 
            key={prof.id}
            onClick={() => {
              setSelectedProf(prof);
              setIsModalOpen(true);
            }}
            className="bg-card border border-white/5 rounded-[40px] p-8 space-y-6 cursor-pointer hover:border-primary/30 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                  <User size={40} />
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-card",
                  prof.status === 'Disponível' ? "bg-success" : prof.status === 'Em Atendimento' ? "bg-accent" : "bg-gray-500"
                )} />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProf(prof);
                  setIsModalOpen(true);
                }}
                className="p-2 text-gray-600 hover:text-white transition-colors"
              >
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{prof.name}</h3>
              <p className="text-primary font-medium text-sm">{prof.role}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {prof.specialty.slice(0, 2).map(s => (
                <span key={s} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {s}
                </span>
              ))}
              {prof.specialty.length > 2 && (
                <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-gray-500">
                  +{prof.specialty.length - 2}
                </span>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold">{prof.rating}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} />
                <span className="text-xs font-bold">{getAppointmentsToday(prof.id)} agend. hoje</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <div 
          onClick={() => {
            setSelectedProf(null);
            setIsModalOpen(true);
          }}
          className="bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
            <Plus size={32} />
          </div>
          <p className="font-bold text-gray-500 group-hover:text-white transition-colors">Adicionar Profissional</p>
        </div>
      </div>

      {/* Modal */}
      <ProfessionalModal 
        professional={selectedProf} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        appointmentsToday={selectedProf ? getAppointmentsToday(selectedProf.id) : 0}
        onDelete={deleteProfessional}
        onSave={handleSave}
      />
    </div>
  );
}
