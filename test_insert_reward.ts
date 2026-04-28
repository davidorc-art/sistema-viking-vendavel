import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = process.env.USER_EMAIL || 'davidorc@gmail.com';
  // Login first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123' // Or hopefully they don't have RLS blocking me if I just want to see the error
  });
  
  if (authError) {
    console.log("Auth error:", authError);
    // Let's try inserting without auth if RLS allows it
  } else {
    console.log("Auth success");
  }

  const { data, error } = await supabase.from('rewards').insert([{
    id: "test",
    title: "Test Reward",
    points: 10,
    description: "test",
    icon: "test"
  }]).select();
  
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
