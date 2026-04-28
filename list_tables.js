import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not work
  if (error) {
      // Fallback: try to select from a non-existent table to get an error with table list if possible
      // Or just check common names
      const tables = ['appointments', 'inventory', 'products', 'transactions', 'clients', 'professionals', 'settings', 'consent_forms', 'loyalty_transactions'];
      console.log('Common tables:', tables);
  } else {
      console.log(data);
  }
}
run();
