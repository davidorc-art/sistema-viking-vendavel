import React, { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Users,
  UserSquare2,
  MessageCircle,
  DollarSign,
  Wallet,
  Package,
  Award,
  ShoppingBag,
  Beer,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Database,
  BrainCircuit,
  Activity,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { motion } from "framer-motion";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  onClick?: () => void;
  index: number;
}

const NavItem = ({ icon: Icon, label, to, onClick, index }: NavItemProps) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={to}
        onClick={onClick}
        className={cn(
          "flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
          active
            ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--color-primary),0.15)] border border-primary/20"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <motion.div
          whileHover={{ scale: 1.2, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon
            size={20}
            className={cn(
              active ? "text-primary" : "text-gray-400 group-hover:text-white"
            )}
          />
        </motion.div>
        <span className="text-sm font-medium">{label}</span>
      </Link>
    </motion.div>
  );
};

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const { professionals } = useData();
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const userName = user?.email?.split("@")[0] || "Usuário";

  const isDavid = user?.email?.toLowerCase().includes("david");
  const professionalName = isDavid ? "David" : "Jeynne";
  const isProfessional = professionals.some((p) =>
    p.name.toLowerCase().includes(professionalName.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 glass-panel border-r border-white/5 z-50 transition-transform duration-300 lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(255,107,0,0.3)] bg-primary/20 flex items-center justify-center text-primary"
          >
            <ShieldCheck size={24} />
          </motion.div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">
              VIKING STUDIO
            </h1>
            <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">
              Management System
            </p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
          <section>
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Principal
            </p>
            <div className="space-y-1">
              <NavItem
                icon={LayoutDashboard}
                label="Dashboard"
                to="/"
                onClick={onClose}
                index={0}
              />
              <NavItem
                icon={Activity}
                label="Saúde do Sistema"
                to="/saude-sistema"
                onClick={onClose}
                index={1}
              />
              {isProfessional && (
                <NavItem
                  icon={UserSquare2}
                  label="Meu Painel"
                  to="/meu-painel"
                  onClick={onClose}
                  index={2}
                />
              )}
              <NavItem
                icon={Calendar}
                label="Agenda"
                to="/agenda"
                onClick={onClose}
                index={3}
              />
              <NavItem
                icon={Users}
                label="Clientes"
                to="/clientes"
                onClick={onClose}
                index={4}
              />
              <NavItem
                icon={MessageCircle}
                label="CRM & Marketing"
                to="/crm"
                onClick={onClose}
                index={5}
              />
            </div>
          </section>

          <section>
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Gestão
            </p>
            <div className="space-y-1">
              <NavItem
                icon={BrainCircuit}
                label="Gestão Financeira"
                to="/gestao"
                onClick={onClose}
                index={6}
              />
              <NavItem
                icon={UserSquare2}
                label="Profissionais"
                to="/profissionais"
                onClick={onClose}
                index={7}
              />
              <NavItem
                icon={BarChart3}
                label="Relatórios"
                to="/relatorios"
                onClick={onClose}
                index={8}
              />
              <NavItem
                icon={Package}
                label="Estoque"
                to="/estoque"
                onClick={onClose}
                index={9}
              />
              <NavItem
                icon={Database}
                label="Backup e Restauro"
                to="/backup"
                onClick={onClose}
                index={9}
              />
            </div>
          </section>

          <section>
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Extras
            </p>
            <div className="space-y-1">
              <NavItem
                icon={LinkIcon}
                label="Gerador de Links"
                to="/gerador-links"
                onClick={onClose}
                index={11}
              />
              <NavItem
                icon={Award}
                label="Fidelidade"
                to="/fidelidade"
                onClick={onClose}
                index={12}
              />
              <NavItem
                icon={ShoppingBag}
                label="Loja"
                to="/loja"
                onClick={onClose}
                index={13}
              />
              <NavItem
                icon={Beer}
                label="Bar"
                to="/bar"
                onClick={onClose}
                index={14}
              />
              <NavItem
                icon={Settings}
                label="Configurações"
                to="/configuracoes"
                onClick={onClose}
                index={15}
              />
            </div>
          </section>
        </div>

        <div className="p-4 mt-auto border-t border-white/5">
          <motion.div
            whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            className="glass-card bg-white/5 rounded-2xl p-4 mb-4"
          >
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              Conta
            </p>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden bg-black flex items-center justify-center text-primary font-bold"
              >
                {userInitial}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </motion.div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 w-full rounded-xl transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}
