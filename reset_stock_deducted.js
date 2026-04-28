import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('appointments')
    .update({ stock_deducted: false })
    .gte('date', '2026-04-01');
    
  if (error) console.error(error);
  else console.log('Reset successful');
}
run();
