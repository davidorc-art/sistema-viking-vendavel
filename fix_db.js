import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTable() {
  console.log('Checking for missing columns in appointments table...');
  
  // We can't easily add columns via the JS client without a custom RPC or SQL.
  // But we can check if they exist.
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const columns = data[0] ? Object.keys(data[0]) : [];
  console.log('Current columns:', columns);
  
  const missing = [];
  if (!columns.includes('payment_link_id')) missing.push('payment_link_id');
  if (!columns.includes('payment_status')) missing.push('payment_status');
  if (!columns.includes('payment_url')) missing.push('payment_url');
  
  if (missing.length > 0) {
    console.log('Missing columns:', missing);
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS payment_link_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_status TEXT,
      ADD COLUMN IF NOT EXISTS payment_url TEXT;
    `);
  } else {
    console.log('All columns exist.');
  }
}

fixTable();
