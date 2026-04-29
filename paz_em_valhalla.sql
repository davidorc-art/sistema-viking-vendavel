-- SQL DE "PAZ EM VALHALLA"
-- Este script garante a compatibilidade com versões antigas do código/cache do navegador
-- reinserindo as colunas com nomes em português que foram removidas, mas que ainda
-- podem estar sendo enviadas por bundles defasados.

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clients(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES professionals(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS servico TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS data DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hora TIME;

-- Faz o mesmo para outras tabelas se necessário (preventivo)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS papel TEXT;

-- Notifica o PostgREST para recarregar o schema IMEDIATAMENTE
NOTIFY pgrst, 'reload schema';
