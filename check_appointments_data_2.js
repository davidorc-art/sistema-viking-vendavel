import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, client_name, professional_id, consent_signed, consent_data')
    .eq('consent_signed', true)
    .limit(5);

  if (error) {
    console.error('Error fetching appointments:', error);
  } else {
    console.log('Appointments data:');
    data.forEach(a => {
      console.log(`- ${a.client_name}: professional_id=${a.professional_id}`);
      if (a.consent_data) {
        const cd = typeof a.consent_data === 'string' ? JSON.parse(a.consent_data) : a.consent_data;
        console.log(`  professionalSignature value:`, cd.professionalSignature);
        console.log(`  professional_signature value:`, cd.professional_signature);
      }
    });
  }
}

checkData();
