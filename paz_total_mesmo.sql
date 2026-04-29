-- SQL "PAZ TOTAL MESMO"
-- Este script garante que todas as variações de nomes de colunas existam no banco,
-- prevenindo erros de "column not found" independente de qual bundle o cliente esteja usando.

-- TABELA: appointments
DO $$ 
BEGIN
    -- CLIENT ID VARIATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='client_id') THEN
        ALTER TABLE public.appointments ADD COLUMN client_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='clientid') THEN
        ALTER TABLE public.appointments ADD COLUMN clientid UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='cliente_id') THEN
        ALTER TABLE public.appointments ADD COLUMN cliente_id UUID;
    END IF;

    -- PROFESSIONAL ID VARIATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_id') THEN
        ALTER TABLE public.appointments ADD COLUMN professional_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professionalid') THEN
        ALTER TABLE public.appointments ADD COLUMN professionalid UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='profissional_id') THEN
        ALTER TABLE public.appointments ADD COLUMN profissional_id UUID;
    END IF;

    -- OTHER FIELD VARIATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='total_value') THEN
        ALTER TABLE public.appointments ADD COLUMN total_value NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='totalvalue') THEN
        ALTER TABLE public.appointments ADD COLUMN totalvalue NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='valor_total') THEN
        ALTER TABLE public.appointments ADD COLUMN valor_total NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='deposit_percentage') THEN
        ALTER TABLE public.appointments ADD COLUMN deposit_percentage NUMERIC DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='depositpercentage') THEN
        ALTER TABLE public.appointments ADD COLUMN depositpercentage NUMERIC DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='porcentagem_sinal') THEN
        ALTER TABLE public.appointments ADD COLUMN porcentagem_sinal NUMERIC DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='valor') THEN
        ALTER TABLE public.appointments ADD COLUMN valor NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='servico') THEN
        ALTER TABLE public.appointments ADD COLUMN servico TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='data') THEN
        ALTER TABLE public.appointments ADD COLUMN data DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='hora') THEN
        ALTER TABLE public.appointments ADD COLUMN hora TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='client_name') THEN
        ALTER TABLE public.appointments ADD COLUMN client_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='clientname') THEN
        ALTER TABLE public.appointments ADD COLUMN clientname TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_name') THEN
        ALTER TABLE public.appointments ADD COLUMN professional_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professionalname') THEN
        ALTER TABLE public.appointments ADD COLUMN professionalname TEXT;
    END IF;

    -- CONSENT AND PAYMENT FIELDS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='consent_sent') THEN
        ALTER TABLE public.appointments ADD COLUMN consent_sent BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='consent_signed') THEN
        ALTER TABLE public.appointments ADD COLUMN consent_signed BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='consent_data') THEN
        ALTER TABLE public.appointments ADD COLUMN consent_data JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='payment_status') THEN
        ALTER TABLE public.appointments ADD COLUMN payment_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='payment_url') THEN
        ALTER TABLE public.appointments ADD COLUMN payment_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='paid_value') THEN
        ALTER TABLE public.appointments ADD COLUMN paid_value NUMERIC;
    END IF;
END $$;

-- TABELA: clients
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='total_spent') THEN
        ALTER TABLE public.clients ADD COLUMN total_spent NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='totalspent') THEN
        ALTER TABLE public.clients ADD COLUMN totalspent NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='last_visit') THEN
        ALTER TABLE public.clients ADD COLUMN last_visit TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='lastvisit') THEN
        ALTER TABLE public.clients ADD COLUMN lastvisit TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='birth_date') THEN
        ALTER TABLE public.clients ADD COLUMN birth_date TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='birthdate') THEN
        ALTER TABLE public.clients ADD COLUMN birthdate TEXT;
    END IF;
END $$;

-- Recarregar o schema
NOTIFY pgrst, 'reload schema';
