import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const id = Math.random().toString(36).substr(2, 10);
  const { data, error } = await supabase.from('transactions').insert([{ 
    id, 
    description: 'test recurring', 
    value: 10, 
    type: 'Receita', 
    category: 'Serviços', 
    date: '2023-01-01', 
    status: 'Pago', 
    method: 'Dinheiro',
    is_recurring: true,
    recurrence_type: 'Mensal'
  }]).select();
  
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted:', data);
    await supabase.from('transactions').delete().eq('id', data[0].id);
  }
}

main();
