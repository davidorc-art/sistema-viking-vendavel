import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function checkType() {
  const { data, error } = await supabase.from('rewards').insert([{
    id: "this_is_not_a_uuid",
    title: "Test",
    points: 10,
    description: "test",
    icon: "test"
  }]).select();
  console.log(error);
}
checkType();
