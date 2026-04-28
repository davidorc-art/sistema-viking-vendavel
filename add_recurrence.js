import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Adding recurrence column to blocked_times...');
  
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `ALTER TABLE blocked_times ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'none';` 
  });
  
  if (error) {
    console.error(`Error adding recurrence to blocked_times:`, error.message);
  } else {
    console.log(`Successfully added recurrence to blocked_times`);
  }
}

main();
