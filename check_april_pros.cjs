
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAprilApptPros() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date, professional_id, professional_name')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');

  if (error) {
    console.error('Error fetching April appointments:', error);
    return;
  }

  console.log(`Found ${data.length} appointments in April 2026:`);
  const proCounts = {};

  data.forEach(a => {
    const key = `${a.professional_id} (${a.professional_name})`;
    proCounts[key] = (proCounts[key] || 0) + 1;
  });

  console.log('Professional ID counts:', proCounts);
  console.log('Sample data:', data.slice(0, 5));
}

checkAprilApptPros();
