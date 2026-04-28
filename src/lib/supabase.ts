import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('DEBUG SUPABASE: VITE_SUPABASE_URL exists:', !!supabaseUrl);
console.log('DEBUG SUPABASE: VITE_SUPABASE_ANON_KEY exists:', !!supabaseKey);

// Auto-fix missing protocol
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseKey || 'placeholder-key';

if (!supabaseUrl || !supabaseKey || !isValidUrl(supabaseUrl)) {
  console.warn('Supabase credentials not found or invalid. Please check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(finalUrl, finalKey);
