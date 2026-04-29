-- VIKING ULTIMATE DATABASE FIX
-- Este script resolve definitivamente as inconsistências de colunas.
-- Execute este script no SQL Editor do seu Supabase.

-- 1. Limpeza de colunas redundantes e criação das colunas padrão
-- TABELA: clients
DO $$ 
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='total_spent') THEN
        ALTER TABLE public.clients ADD COLUMN total_spent NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='last_visit') THEN
        ALTER TABLE public.clients ADD COLUMN last_visit TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='birth_date') THEN
        ALTER TABLE public.clients ADD COLUMN birth_date TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id') THEN
        ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Remover colunas problemáticas (aliases que causaram erro)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='totalspent') THEN
        ALTER TABLE public.clients DROP COLUMN totalspent;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='lastvisit') THEN
        ALTER TABLE public.clients DROP COLUMN lastvisit;
    END IF;
END $$;

-- TABELA: appointments
DO $$ 
BEGIN
    -- Adicionar colunas padronizadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='client_id') THEN
        ALTER TABLE public.appointments ADD COLUMN client_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='client_name') THEN
        ALTER TABLE public.appointments ADD COLUMN client_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_id') THEN
        ALTER TABLE public.appointments ADD COLUMN professional_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_name') THEN
        ALTER TABLE public.appointments ADD COLUMN professional_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='total_value') THEN
        ALTER TABLE public.appointments ADD COLUMN total_value NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='deposit_percentage') THEN
        ALTER TABLE public.appointments ADD COLUMN deposit_percentage NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='approval_status') THEN
        ALTER TABLE public.appointments ADD COLUMN approval_status TEXT DEFAULT 'Pendente';
    END IF;

    -- REMOVER ALIASES QUE ESTAVAM CAUSANDO ERRO (PENSANDO FORA DA CAIXA)
    -- Remover colunas em português ou colunas sem underscore que causavam conflitos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='cliente_id') THEN
        ALTER TABLE public.appointments DROP COLUMN cliente_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='clientid') THEN
        ALTER TABLE public.appointments DROP COLUMN clientid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professionalid') THEN
        ALTER TABLE public.appointments DROP COLUMN professionalid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='totalvalue') THEN
        ALTER TABLE public.appointments DROP COLUMN totalvalue;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='depositpercentage') THEN
        ALTER TABLE public.appointments DROP COLUMN depositpercentage;
    END IF;
END $$;

-- TABELA: professionals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='professionals' AND column_name='signature') THEN
        ALTER TABLE public.professionals ADD COLUMN signature TEXT;
    END IF;
    -- Se existir 'assinatura', tenta migrar o dado se signature estiver vazio, e então remove
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='professionals' AND column_name='assinatura') THEN
        UPDATE public.professionals SET signature = assinatura WHERE signature IS NULL OR signature = '';
        ALTER TABLE public.professionals DROP COLUMN assinatura;
    END IF;
END $$;

-- 2. Garantir que o cache do Supabase (PostgREST) seja recarregado
NOTIFY pgrst, 'reload schema';

-- 3. Mensagem de finalização
SELECT 'Banco de dados Vikings limpo e padronizado com sucesso!' as status;
