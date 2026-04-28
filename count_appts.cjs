
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countAppts() {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting appointments:', error);
    return;
  }

  console.log('Total appointments in database:', count);
}

countAppts();
