import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClients() {
  const { data, error } = await supabase.from('clients').select('id, name, cpf').limit(5);
  console.log('Clients Read Test:', { count: data?.length, error });
  if (data && data.length > 0) {
    console.log('First client:', data[0]);
  }
}

checkClients();
