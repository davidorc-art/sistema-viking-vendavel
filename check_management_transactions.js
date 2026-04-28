import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('management_transactions').select('*');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log(`Found ${data.length} management_transactions`);
    if (data.length > 0) {
      console.log('First one:', data[0]);
    }
  }
}

main();
