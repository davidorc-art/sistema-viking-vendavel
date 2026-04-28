import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tables = ['clients', 'professionals', 'appointments', 'transactions', 'inventory', 'products', 'drinks', 'rewards', 'consent_forms', 'blocked_times', 'settings'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('user_id').limit(1);
    if (error && error.code === '42703') {
      console.log(`Table ${table} does NOT have user_id column.`);
    } else if (error) {
      console.log(`Table ${table} error: ${error.message}`);
    } else {
      console.log(`Table ${table} HAS user_id column.`);
    }
  }
}

main();
