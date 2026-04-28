import React, { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw, FileJson } from 'lucide-react';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function BackupRestore() {
  const { exportData, importData, clearAllData, refreshData, isSyncing } = useData();
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `viking_backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar backup.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const success = await importData(json);
        if (success) {
          toast.success('Backup restaurado com sucesso!');
        } else {
          toast.error('Erro ao restaurar backup. Verifique o arquivo.');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Arquivo de backup inválido.');
      } finally {
        setIsImporting(false);
        // Reset input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const success = await clearAllData();
      if (success) {
        toast.success('Todos os dados foram apagados.');
        setShowConfirmClear(false);
      } else {
        toast.error('Erro ao apagar dados.');
      }
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Erro fatal ao apagar dados.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <RefreshCw className={`w-8 h-8 ${isSyncing ? 'animate-spin' : ''}`} />
          Backup e Restauração
        </h1>
        <p className="text-gray-400">
          Gerencie a segurança dos seus dados. Exporte backups regulares ou restaure informações de arquivos anteriores.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Download className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Exportar Dados</h2>
              <p className="text-sm text-gray-400 text-balance">Baixe uma cópia completa de todos os dados do sistema.</p>
            </div>
          </div>
          
          <div className="bg-zinc-950 rounded-lg p-4 mb-6 border border-zinc-800">
            <ul className="text-xs text-gray-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" /> Agendamentos e Clientes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" /> Financeiro e Transações
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" /> Estoque e Produtos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" /> Configurações e Profissionais
              </li>
            </ul>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Baixar Backup (.json)
          </button>
        </motion.div>

        {/* Import Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Upload className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Restaurar Dados</h2>
              <p className="text-sm text-gray-400 text-balance">Importe dados de um arquivo de backup salvo anteriormente.</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                A restauração irá mesclar os dados do arquivo com os dados atuais. 
                IDs duplicados serão atualizados com as informações do backup.
              </p>
            </div>
          </div>

          <label className="relative block w-full">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="backup-upload"
            />
            <div className={`
              w-full py-3 border-2 border-dashed border-zinc-700 rounded-lg 
              flex items-center justify-center gap-2 cursor-pointer
              hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all
              ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              {isImporting ? (
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
              ) : (
                <FileJson className="w-5 h-5 text-emerald-500" />
              )}
              <span className="text-gray-300 font-medium">
                {isImporting ? 'Restaurando...' : 'Selecionar Arquivo'}
              </span>
            </div>
          </label>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-red-500/5 border border-red-500/20 rounded-xl p-6 mt-4"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-500">Zona de Perigo</h2>
                <p className="text-sm text-gray-400">Apague permanentemente todos os dados do sistema e do banco de dados.</p>
              </div>
            </div>

            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg font-medium transition-colors"
              >
                Limpar Tudo
              </button>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <p className="text-sm text-red-400 font-medium">Tem certeza absoluta?</p>
                <button
                  onClick={handleClear}
                  disabled={isClearing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isClearing ? 'Apagando...' : 'SIM, APAGAR TUDO'}
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800 flex justify-between items-center text-gray-500 text-sm">
        <p>Sistema de Backup Viking v2.0</p>
        <button 
          onClick={() => refreshData()}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Agora
        </button>
      </div>
    </div>
  );
}
