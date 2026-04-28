import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testando inserção direta na tabela management_transactions...');
  
  const testData = {
    id: crypto.randomUUID(),
    description: 'Teste de inserção via script',
    value: 10.50,
    type: 'Receita',
    category: 'Teste',
    date: '2026-04-10',
    status: 'Pago',
    method: 'Pix'
  };

  const { data, error } = await supabase.from('management_transactions').insert([testData]).select();
  
  if (error) {
    console.error('❌ Erro na inserção:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Inserção bem-sucedida!', data);
  }
}

testInsert();
