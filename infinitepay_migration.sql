-- Script Completo para Ajustes no Supabase

-- Cria a tabela settings caso o usuário ainda não a tenha (Foi adicionada em versões recentes)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  studio_name TEXT,
  phone TEXT,
  instagram TEXT,
  address TEXT,
  maps_link TEXT,
  opening_hours TEXT,
  default_commission NUMERIC,
  custom_commission BOOLEAN,
  professional_ranking BOOLEAN,
  payment_methods JSONB,
  loyalty_active BOOLEAN,
  points_per_real NUMERIC,
  point_value NUMERIC,
  points_per_referral NUMERIC,
  points_per_birthday NUMERIC,
  default_duration NUMERIC,
  appointment_interval NUMERIC,
  allow_overbooking BOOLEAN,
  low_stock_alert BOOLEAN,
  allow_negative_stock BOOLEAN,
  sell_without_client BOOLEAN,
  allow_courtesy BOOLEAN,
  courtesy_limit NUMERIC,
  allow_deposit BOOLEAN,
  deposit_percentage NUMERIC,
  two_factor BOOLEAN,
  infinite_pay_tag TEXT,
  pix_key TEXT,
  pix_name TEXT,
  city TEXT,
  activity_log BOOLEAN,
  services JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativa RLS e Policies para settings (se já não estiverem)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Settings is public" ON settings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can update settings" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- Adiciona colunas do InfinitePay para segurança (caso tabela já exista)
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS infinite_pay_tag TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS infinite_pay_tag TEXT;
