import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const tables = ['management_transactions', 'management_categories', 'management_rules', 'loyalty_transactions'];
  console.log('Verificando tabelas de gestão financeira...');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Tabela ${table}: Não encontrada ou inacessível. Erro: ${error.message}`);
    } else {
      console.log(`✅ Tabela ${table}: Existe e está acessível.`);
    }
  }
}
check();
