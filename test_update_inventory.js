import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('inventory')
    .update({ stock: 2, status: 'Em estoque' })
    .eq('id', 'e8285dca-e398-4e92-9177-aef821f75def');
    
  if (error) console.error(error);
  else console.log('Update successful');
}
run();
