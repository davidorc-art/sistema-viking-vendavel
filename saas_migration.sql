-- Migration SaaS - Assinatura R$70/mês
-- Copie e cole este código no SQL Editor do seu Supabase e clique em 'Run'

-- 1. Tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
    price_amount NUMERIC DEFAULT 70.00,
    trial_start TIMESTAMPTZ DEFAULT now(),
    trial_ends_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Habilitar Segurança (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver a própria assinatura" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar a própria assinatura caso não tenham" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar a própria assinatura" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.uid() = user_id);

-- 2. Trigger para criar usuário automaticamente na tabela de subscriptions e garantir trial de 7 dias
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, trial_ends_at)
  VALUES (NEW.id, 'trialing', now() + INTERVAL '7 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the trigger if it already exists to recreate
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- 3. Inserir trial para usuários já existentes que não tem registro
INSERT INTO public.subscriptions (user_id, status, trial_ends_at)
SELECT id, 'trialing', now() + INTERVAL '7 days' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.subscriptions);

