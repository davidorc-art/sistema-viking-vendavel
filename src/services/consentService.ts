import { supabase } from '../lib/supabase';

export interface ConsentTerm {
  id: string;
  type: 'Tattoo' | 'Piercing';
  content: string;
}

export const fetchTerms = async (): Promise<ConsentTerm[]> => {
  console.log('Fetching consent terms from Supabase...');
  const { data, error } = await supabase
    .from('consent_terms')
    .select('*');
    
  if (error) {
    console.error('Supabase error fetching terms:', error);
    throw error;
  }
  console.log('Terms fetched successfully:', data);
  return data || [];
};

export const saveTerms = async (terms: ConsentTerm[]) => {
  console.log('Saving consent terms to Supabase:', terms);
  const { error } = await supabase
    .from('consent_terms')
    .upsert(terms);
    
  if (error) {
    console.error('Supabase error saving terms:', error);
    throw error;
  }
  console.log('Terms saved successfully');
};
