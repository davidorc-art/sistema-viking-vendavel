import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRLS() {
  const { data, error } = await supabase.rpc('help'); // Just try to see what error the previous guy got
  // To check RLS, we can check if it returns only rows we own, etc.
  
  // Let's create an anonymous reward and then a reward while authenticated and see if it reads them. We already have 'test' which is anonymous.
  
  const { data: anonData } = await supabase.from('rewards').select('*');
  console.log('Anon data length:', anonData?.length);
  
}
checkRLS();
