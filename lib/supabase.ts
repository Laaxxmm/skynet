
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  // Remove quotes and whitespace which cause "Invalid value" in fetch headers
  supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/['"]/g, '').trim();
  supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();
} catch (e) {
  console.error('Error loading env vars:', e);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key. Authentication will not work.');
}

// Config loaded


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
