
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDateFormats() {
  const { data, error } = await supabase
    .from('appointments')
    .select('date')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');

  if (error) {
    console.error('Error fetching April appointments:', error);
    return;
  }

  const formats = {};
  data.forEach(a => {
    const format = a.date.includes('-') ? 'YYYY-MM-DD' : 'unknown';
    const parts = a.date.split('-');
    const month = parts[1];
    const day = parts[2];
    const key = `M:${month} D:${day}`;
    formats[key] = (formats[key] || 0) + 1;
  });

  console.log('Date formats in April:', formats);
}

checkDateFormats();
