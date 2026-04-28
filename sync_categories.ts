import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '42524b84-7239-45b7-bcd6-a9275272d086';

async function restoreCategories() {
  const categories = [
    { name: 'Serviços', type: 'Receita' },
    { name: 'Aluguel', type: 'Despesa' },
    { name: 'Contas', type: 'Despesa' },
    { name: 'Pessoal', type: 'Despesa' },
    { name: 'Marketing', type: 'Despesa' },
    { name: 'Sinal', type: 'Receita' }
  ].map(c => ({ ...c, user_id: USER_ID }));

  await supabase.from('management_categories').upsert(categories, { onConflict: 'name,user_id' });
  console.log('Categories synced.');
}

restoreCategories();
