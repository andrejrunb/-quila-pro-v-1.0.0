import { supabase } from './supabase';

export async function testSupabase() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) console.error('Erro Supabase:', error);
  else console.log('Dados Supabase:', data);
}
