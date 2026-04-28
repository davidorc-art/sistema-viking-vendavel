
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listProfessionals() {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, name');

  if (error) {
    console.error('Error fetching professionals:', error);
    return;
  }

  console.log('Professionals in database:');
  console.table(data);
}

listProfessionals();
