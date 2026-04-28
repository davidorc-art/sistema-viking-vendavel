import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAprilAppointments() {
  const { data, error, count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');

  if (error) {
    console.error('Error fetching April appointments:', error);
    return;
  }

  console.log(`Total appointments in April 2026: ${count}`);
  if (data && data.length > 0) {
    console.log('Sample April appointments:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  } else {
    // Check if there are ANY appointments after March
    const { count: afterMarchCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gt('date', '2026-03-31');
    console.log(`Total appointments after March 2026: ${afterMarchCount}`);
  }
}

checkAprilAppointments();
