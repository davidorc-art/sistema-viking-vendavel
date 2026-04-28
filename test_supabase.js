import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('DEBUG: URL:', supabaseUrl);
console.log('DEBUG: KEY:', supabaseKey ? 'PRESENT' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  if (error) {
    console.error('Connection test failed:', error.message);
  } else {
    console.log('Connection test successful! Data:', data);
  }
}

testConnection();
