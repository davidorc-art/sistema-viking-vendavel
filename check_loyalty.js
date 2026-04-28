import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Checking for exec_sql RPC...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (rpcError) console.error('exec_sql not found or failed:', rpcError.message);
  else console.log('exec_sql exists!');
}
run();
