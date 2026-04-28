
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function deleteOrphans() {
  const orphanApptIds = [
    'test-id-123',
    '0fae2227-b21c-4451-9557-82d2bfc90e90',
    'b8906088-61a7-4c4e-90a2-0d9fd00d3c4a',
    '4f86de8e-8e2f-47d0-8d60-39d04e485abb',
    '47a1ce45-64ca-4ad8-bd35-6c26861ff4f5',
    'fcbdefd6-9b40-408b-817b-cbe624c81ff2'
  ];

  console.log('Deleting orphaned appointments...');
  const { error } = await supabase.from('appointments').delete().in('id', orphanApptIds);
  
  if (error) {
    console.error('Error deleting orphans:', error.message);
  } else {
    console.log('Successfully deleted orphaned appointments.');
  }
}

deleteOrphans();
