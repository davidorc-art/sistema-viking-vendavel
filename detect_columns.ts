import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detect() {
  console.log('--- DETECTANDO COLUNAS ---');
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  if (error) {
    console.error('Erro ao selecionar:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Colunas encontradas:', Object.keys(data[0]));
  } else {
    // Try to force select a specific column common in my code
    const { error: error2 } = await supabase.from('appointments').select('client_id').limit(1);
    console.log('Sucesso ao selecionar client_id:', !error2);
    
    const { error: error3 } = await supabase.from('appointments').select('cliente_id').limit(1);
    console.log('Sucesso ao selecionar cliente_id (com e):', !error3);

    const { error: error4 } = await supabase.from('appointments').select('deposit_percentage').limit(1);
    console.log('Sucesso ao selecionar deposit_percentage:', !error4);

    const { error: error4b } = await supabase.from('appointments').select('depositpercentage').limit(1);
    console.log('Sucesso ao selecionar depositpercentage:', !error4b);

    const { error: error4c } = await supabase.from('appointments').select('porcentagem_sinal').limit(1);
    console.log('Sucesso ao selecionar porcentagem_sinal:', !error4c);

    const { error: error5 } = await supabase.from('appointments').select('total_value').limit(1);
    console.log('Sucesso ao selecionar total_value:', !error5);
  }
}

detect();
