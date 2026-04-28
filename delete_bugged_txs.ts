import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findBuggedTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*');

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  // Find transactions with very high values or weird descriptions
  const bugged = data.filter(t => {
    const desc = t.description || '';
    const hasWeirdChars = desc.includes('Ã£') || desc.includes('Ã©') || desc.includes('Ã§');
    const hasLongNumbers = /\d{10,}/.test(desc);
    const isVeryHigh = t.value > 100000; // 100k+
    
    // Also check if it was likely imported today (e.g. date is recent or matches the bugged pattern)
    return hasWeirdChars || hasLongNumbers || isVeryHigh;
  });

  console.log(`Found ${bugged.length} bugged transactions.`);
  bugged.slice(0, 5).forEach(t => {
    console.log(`ID: ${t.id} | Desc: ${t.description} | Value: ${t.value} | Date: ${t.date}`);
  });

  // Delete them
  if (bugged.length > 0) {
    const idsToDelete = bugged.map(t => t.id);
    console.log(`Deleting ${idsToDelete.length} transactions...`);
    
    // Delete in batches of 100
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const { error: delError } = await supabase
        .from('transactions')
        .delete()
        .in('id', batch);
        
      if (delError) {
        console.error('Error deleting batch:', delError);
      } else {
        console.log(`Deleted batch of ${batch.length}`);
      }
    }
    console.log('Deletion complete.');
  }
}

findBuggedTransactions();
