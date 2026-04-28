-- Migration Mercado Pago Configs
-- Tabela para armazenar chaves do Mercado Pago dos usuários

CREATE TABLE IF NOT EXISTS public.user_payment_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_access_token TEXT,
  mp_public_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
