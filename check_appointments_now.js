import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching appointments:', error);
  } else {
    console.log('Appointments data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkData();
