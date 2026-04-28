import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserId() {
  // Try to find any record that has a user_id
  const tables = ['professionals', 'clients', 'appointments', 'transactions'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('user_id').limit(1);
    if (data && data.length > 0 && data[0].user_id) {
      return data[0].user_id;
    }
  }
  return null;
}

findUserId().then(id => console.log('USER_ID:', id));
