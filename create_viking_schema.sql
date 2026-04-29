-- MASTER SCHEMA FOR VIKING SYSTEM - PRODUCTION COMPATIBILITY
-- Execute no SQL Editor do Supabase (Aperte Ctrl+Enter para rodar)

-- 1. Tabela de Profissionais
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Profissional',
    specialty TEXT[] DEFAULT '{}',
    rating NUMERIC DEFAULT 5,
    status TEXT DEFAULT 'Disponível',
    avatar TEXT,
    commission NUMERIC DEFAULT 0,
    assinatura TEXT, -- signature base64
    signature TEXT, -- alias
    pix_key TEXT,
    pix_name TEXT,
    city TEXT,
    infinity_pay_tag TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Ativo',
    points NUMERIC DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    totalspent NUMERIC DEFAULT 0, -- alias
    birth_date TEXT,
    birth_date_iso DATE,
    cpf TEXT,
    instagram TEXT,
    city TEXT,
    medical_notes TEXT,
    indicated_by TEXT,
    is_minor BOOLEAN DEFAULT false,
    notes TEXT,
    level TEXT DEFAULT 'Bronze',
    last_visit TEXT,
    lastvisit TEXT, -- alias
    last_visit_iso DATE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id),
    client_name TEXT,
    clientid UUID, -- alias
    clientname TEXT, -- alias
    professional_id UUID REFERENCES public.professionals(id),
    professional_name TEXT,
    professionalid UUID, -- alias
    professionalname TEXT, -- alias
    service TEXT NOT NULL,
    servico TEXT, -- alias
    date TEXT NOT NULL,
    data TEXT, -- alias
    time TEXT NOT NULL,
    hora TEXT, -- alias
    status TEXT DEFAULT 'Pendente',
    approval_status TEXT DEFAULT 'Aprovado',
    payment_status TEXT DEFAULT 'Pendente',
    payment_url TEXT,
    payment_link_id TEXT,
    value NUMERIC DEFAULT 0,
    valor NUMERIC DEFAULT 0, -- alias
    paid_value NUMERIC DEFAULT 0,
    paidvalue NUMERIC DEFAULT 0, -- alias
    total_value NUMERIC DEFAULT 0,
    totalvalue NUMERIC DEFAULT 0, -- alias
    deposit_percentage NUMERIC DEFAULT 0,
    depositpercentage NUMERIC DEFAULT 0, -- alias
    rescheduled_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 60,
    consent_sent BOOLEAN DEFAULT false,
    consent_signed BOOLEAN DEFAULT false,
    consent_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT,
    value NUMERIC NOT NULL,
    type TEXT, -- Receita, Despesa
    category TEXT,
    date TEXT,
    status TEXT DEFAULT 'Pago',
    method TEXT DEFAULT 'Pix',
    appointment_id UUID REFERENCES public.appointments(id),
    appointmentid UUID, -- alias
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabelas de Inventário e Loja
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    minstock NUMERIC DEFAULT 0, -- alias
    unit TEXT DEFAULT 'un',
    status TEXT DEFAULT 'Em estoque',
    price NUMERIC DEFAULT 0,
    last_update TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC DEFAULT 0,
    stock NUMERIC DEFAULT 0,
    rating NUMERIC DEFAULT 5,
    image TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC DEFAULT 0,
    stock NUMERIC DEFAULT 0,
    rating NUMERIC DEFAULT 5,
    icon TEXT,
    image TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabelas de Fidelidade
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    points NUMERIC NOT NULL,
    description TEXT,
    icon TEXT,
    points_cost NUMERIC,
    points_required NUMERIC,
    pointscost NUMERIC, -- alias
    pointsrequired NUMERIC, -- alias
    active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id),
    clientid UUID, -- alias
    points NUMERIC NOT NULL,
    type TEXT, -- Ganho, Resgate
    description TEXT,
    date TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Gestão Financeira Avançada
CREATE TABLE IF NOT EXISTS public.management_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    color TEXT,
    icon TEXT,
    origin TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.management_categories(id),
    amount NUMERIC DEFAULT 0,
    type TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

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
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de Horários Bloqueados
CREATE TABLE IF NOT EXISTS public.blocked_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id),
    professional_name TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    reason TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Consent Forms
CREATE TABLE IF NOT EXISTS public.consent_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id),
    client_id UUID REFERENCES public.clients(id),
    type TEXT,
    content TEXT,
    signed_at TIMESTAMPTZ,
    answers JSONB,
    signature TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em tudo
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

-- Políticas Genéricas de Isolamento por Usuário
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'professionals', 'clients', 'appointments', 'transactions', 
            'inventory', 'products', 'drinks', 'rewards', 
            'loyalty_transactions', 'management_transactions', 
            'management_categories', 'management_rules', 'blocked_times', 'consent_forms'
        ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "User Access" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    END LOOP;
END $$;
