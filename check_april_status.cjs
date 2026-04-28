
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAprilApptStatus() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date, approval_status, status')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');

  if (error) {
    console.error('Error fetching April appointments:', error);
    return;
  }

  console.log(`Found ${data.length} appointments in April 2026:`);
  const statusCounts = {};
  const approvalStatusCounts = {};

  data.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    approvalStatusCounts[a.approval_status] = (approvalStatusCounts[a.approval_status] || 0) + 1;
  });

  console.log('Status counts:', statusCounts);
  console.log('Approval Status counts:', approvalStatusCounts);
  console.log('Sample data:', data.slice(0, 5));
}

checkAprilApptStatus();
