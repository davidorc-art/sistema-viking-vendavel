
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('--- Starting System Data Audit ---');

  const tables = [
    'appointments',
    'clients',
    'professionals',
    'transactions',
    'services',
    'settings',
    'consent_forms',
    'blocked_times',
    'loyalty_cards',
    'loyalty_config',
    'inventory'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`[${table}] Error or table does not exist: ${error.message}`);
      continue;
    }
    console.log(`[${table}] Count: ${count}`);
  }

  // Check for orphaned appointments (no professional or no client)
  console.log('\n--- Checking Appointments Integrity ---');
  const { data: appts, error: apptError } = await supabase
    .from('appointments')
    .select('id, professional_id, client_id, professional_name, client_name');

  if (appts) {
    const { data: pros } = await supabase.from('professionals').select('id');
    const { data: clients } = await supabase.from('clients').select('id');

    const proIds = new Set(pros?.map(p => p.id) || []);
    const clientIds = new Set(clients?.map(c => c.id) || []);

    let orphanedPros = 0;
    let orphanedClients = 0;

    appts.forEach(a => {
      if (!proIds.has(a.professional_id)) orphanedPros++;
      if (!clientIds.has(a.client_id)) orphanedClients++;
    });

    console.log(`Orphaned Professionals: ${orphanedPros}`);
    console.log(`Orphaned Clients: ${orphanedClients}`);
  }

  // Check for transactions without appointments (if they are linked)
  console.log('\n--- Checking Transactions Integrity ---');
  const { data: txs } = await supabase.from('transactions').select('id, appointment_id');
  if (txs) {
    const apptIds = new Set(appts?.map(a => a.id) || []);
    let orphanedTxs = 0;
    txs.forEach(t => {
      if (t.appointment_id && !apptIds.has(t.appointment_id)) orphanedTxs++;
    });
    console.log(`Transactions with missing Appointment IDs: ${orphanedTxs}`);
  }

  console.log('\n--- Audit Complete ---');
}

runAudit();
