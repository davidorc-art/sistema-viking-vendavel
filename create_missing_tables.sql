-- SQL para criar as tabelas de Gestão Financeira e Fidelidade que estão faltando
-- Copie e cole este código no SQL Editor do seu Supabase e clique em 'Run'

-- 1. Tabela de Lançamentos Financeiros (Gestão)
CREATE TABLE IF NOT EXISTS public.management_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT,
    value NUMERIC NOT NULL DEFAULT 0,
    type TEXT CHECK (type IN ('Receita', 'Despesa')),
    category TEXT,
    date TEXT,
    status TEXT DEFAULT 'Pendente',
    method TEXT,
    sync_with_main BOOLEAN DEFAULT false,
    main_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Categorias Financeiras
CREATE TABLE IF NOT EXISTS public.management_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Receita', 'Despesa')),
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Regras de Comissionamento/Gestão
CREATE TABLE IF NOT EXISTS public.management_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Porcentagem', 'Fixo')),
    value NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Transações de Fidelidade (Pontos)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    points NUMERIC NOT NULL DEFAULT 0,
    type TEXT CHECK (type IN ('Ganho', 'Resgate')),
    description TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Segurança) e criar políticas básicas para permitir acesso
-- Nota: Se você já tiver políticas específicas, pode pular esta parte
ALTER TABLE public.management_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total (Ajuste conforme sua necessidade de segurança)
CREATE POLICY "Allow all for management_transactions" ON public.management_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for management_categories" ON public.management_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for management_rules" ON public.management_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for loyalty_transactions" ON public.loyalty_transactions FOR ALL USING (true) WITH CHECK (true);
