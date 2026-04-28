import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.example' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase.from('blocked_times').insert([
    {
      id: 'test-id-123',
      professional_id: 'all',
      professional_name: 'Todos os Profissionais',
      date: '2026-03-28',
      time: '00:00',
      duration: 1440,
      reason: 'Test all day'
    }
  ]);

  console.log('Insert result:', error ? error : data);
}

testInsert();
