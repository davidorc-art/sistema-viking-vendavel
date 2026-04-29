-- SQL para criar a tabela professionals e colunas necessárias
-- Execute no SQL Editor do seu Supabase

CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Profissional',
    specialty TEXT[] DEFAULT '{}',
    rating NUMERIC DEFAULT 5,
    status TEXT DEFAULT 'Disponível',
    avatar TEXT,
    commission NUMERIC DEFAULT 0,
    assinatura TEXT, -- base64 signature
    pix_key TEXT,
    pix_name TEXT,
    city TEXT,
    infinity_pay_tag TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'Users can see their own professionals') THEN
        CREATE POLICY "Users can see their own professionals" ON public.professionals FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'Users can insert their own professionals') THEN
        CREATE POLICY "Users can insert their own professionals" ON public.professionals FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'Users can update their own professionals') THEN
        CREATE POLICY "Users can update their own professionals" ON public.professionals FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'Users can delete their own professionals') THEN
        CREATE POLICY "Users can delete their own professionals" ON public.professionals FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Garantir que a coluna user_id existe em todas as tabelas principais
DO $$ 
BEGIN
    -- Lista de tabelas para adicionar user_id
    EXECUTE 'ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE IF EXISTS inventory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
    EXECUTE 'ALTER TABLE IF EXISTS drinks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Algumas tabelas podem não existir ainda.';
END $$;
