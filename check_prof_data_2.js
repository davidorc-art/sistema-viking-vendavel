import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .ilike('name', '%david%');

  if (error) {
    console.error('Error fetching professionals:', error);
  } else {
    console.log('Professionals data:');
    data.forEach(p => {
      console.log(`- ${p.name}: assinatura=${p.assinatura ? 'YES' : 'NO'}, signature=${p.signature ? 'YES' : 'NO'}`);
      console.log('Keys:', Object.keys(p));
    });
  }
}

checkData();
