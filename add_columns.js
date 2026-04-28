import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Attempting to add columns to appointments table...');
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS materials_used JSONB;
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE;
    `
  });
  
  if (error) {
    console.error('Failed to add columns via RPC:', error.message);
    console.log('This is expected if exec_sql RPC is not defined.');
  } else {
    console.log('Columns added successfully!');
  }
}
run();
