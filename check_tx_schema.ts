import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  const { data, error } = await supabase
    .from('management_transactions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  console.log('Management Transaction schema:', Object.keys(data[0] || {}));
}

checkTransactions();
