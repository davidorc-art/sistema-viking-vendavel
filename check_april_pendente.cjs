
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAprilPendente() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date, approval_status, status')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30')
    .or('approval_status.eq.Pendente,approval_status.eq.Aguardando Pagamento');

  if (error) {
    console.error('Error fetching April appointments:', error);
    return;
  }

  console.log(`Found ${data.length} appointments in April 2026 with Pendente or Aguardando Pagamento status.`);
}

checkAprilPendente();
