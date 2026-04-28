import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDateSpaces() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date');

  if (error) {
    console.error('Error fetching appointments:', error);
    return;
  }

  const withSpaces = data.filter(appt => {
    if (!appt.date) return false;
    return appt.date !== appt.date.trim();
  });

  console.log(`Appointments with spaces in date: ${withSpaces.length}`);
  if (withSpaces.length > 0) {
    console.log(JSON.stringify(withSpaces.slice(0, 10), null, 2));
  }
}

checkDateSpaces();
