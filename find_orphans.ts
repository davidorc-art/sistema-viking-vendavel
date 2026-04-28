
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function findOrphans() {
  const { data: appts } = await supabase.from('appointments').select('id, professional_id, client_id, professional_name, client_name');
  const { data: pros } = await supabase.from('professionals').select('id, name');
  const { data: clients } = await supabase.from('clients').select('id, name');

  const proIds = new Set(pros?.map(p => p.id) || []);
  const clientIds = new Set(clients?.map(c => c.id) || []);

  console.log('--- Orphaned Professionals ---');
  appts?.filter(a => !proIds.has(a.professional_id)).forEach(a => {
    console.log(`Appt ID: ${a.id}, Pro ID: ${a.professional_id}, Pro Name: ${a.professional_name}`);
  });

  console.log('\n--- Orphaned Clients ---');
  appts?.filter(a => !clientIds.has(a.client_id)).forEach(a => {
    console.log(`Appt ID: ${a.id}, Client ID: ${a.client_id}, Client Name: ${a.client_name}`);
  });
}

findOrphans();
