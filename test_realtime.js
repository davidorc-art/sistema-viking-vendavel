import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  const { error } = await supabase.rpc('run_sql', { sql: `
    alter publication supabase_realtime add table blocked_times;
  `});
  console.log("Realtime enabled?", error || "SUCCESS");
}
enableRealtime();
