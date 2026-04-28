-- Migration Mercado Pago - SaaS
-- Adiciona colunas para Mercado Pago na tabela de assinaturas

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS mercadopago_customer_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_plan_id TEXT;

-- Atualizar tipos de status permitidos (comentário apenas)
-- status: 'trialing', 'active', 'authorized', 'paused', 'cancelled', 'pending'
