
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

const validateUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const finalUrl = validateUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

console.log('Supabase Config:', {
  url: supabaseUrl ? 'Found' : 'Missing',
  validUrl: validateUrl(supabaseUrl),
  key: supabaseAnonKey ? 'Found' : 'Missing',
  usingUrl: finalUrl
});

if (!validateUrl(supabaseUrl)) {
  console.error('CRITICAL: VITE_SUPABASE_URL is missing or invalid. Authentication will fail.');
}

export const supabase = createClient(finalUrl!, finalKey);
