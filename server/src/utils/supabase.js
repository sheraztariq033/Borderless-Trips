const { createClient } = require('@supabase/supabase-js');

let supabaseInstance = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

module.exports = {};

Object.defineProperty(module.exports, 'supabase', {
  get: () => getSupabase(),
  configurable: true,
  enumerable: true
});
