import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .not('user_id', 'is', null);
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${data.length} transactions to delete.`);
  
  if (data.length > 0) {
    const ids = data.map(t => t.id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', chunk);
        
      if (deleteError) {
        console.error('Error deleting chunk:', deleteError);
      } else {
        console.log(`Deleted chunk of ${chunk.length} transactions.`);
      }
    }
    console.log('Done deleting.');
  }
}

run();
