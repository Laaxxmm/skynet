
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key. Authentication will not work.');
}

console.log('Supabase Config:', {
  url: supabaseUrl ? 'Found' : 'Missing',
  key: supabaseAnonKey ? 'Found' : 'Missing',
  rawUrl: supabaseUrl
});

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
