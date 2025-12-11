
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  // Aggressively sanitize key: Remove anything that is NOT a letter, number, dot, hyphen, or underscore.
  // This removes hidden characters, newlines, quotes, etc.
  supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/[^a-zA-Z0-9\.\-\_]/g, '');
} catch (e) {
  console.error('Error loading env vars:', e);
}

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

export const supabase = createClient(finalUrl!, finalKey);
