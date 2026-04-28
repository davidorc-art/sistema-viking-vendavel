import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log('Recent transactions:');
  data.forEach(t => {
    console.log(`[${t.created_at}] ID: ${t.id} | Desc: ${t.description} | Value: ${t.value} | Type: ${t.type}`);
  });
}

checkTransactions();
