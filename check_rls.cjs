
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking RLS on appointments:', error);
    return;
  }

  console.log('RLS check: Successfully fetched count from appointments table.');
}

checkRLS();
