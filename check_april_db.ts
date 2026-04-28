
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApril() {
  console.log('Checking appointments for April 2026...');
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} appointments in April.`);
  data.forEach(a => {
    console.log(`- ID: ${a.id}, Date: ${a.date}, Time: ${a.time}, Status: ${a.status}, Approval: ${a.approval_status}`);
  });
}

checkApril();
