import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Adding user_id columns...');
  
  const tables = ['clients', 'professionals', 'appointments', 'transactions', 'inventory', 'products', 'drinks', 'rewards', 'consent_forms', 'blocked_times', 'settings'];
  
  for (const table of tables) {
    console.log(`Checking table: ${table}`);
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();` 
    });
    
    if (error) {
      console.error(`Error adding user_id to ${table}:`, error.message);
      // If exec_sql doesn't exist, we might get a 404
    } else {
      console.log(`Successfully added user_id to ${table}`);
    }
  }
}

main();
