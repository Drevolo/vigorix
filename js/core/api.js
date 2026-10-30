import { supabase } from './supabase-client.js';
import { getUser } from './auth.js';

export async function listMyStore() {
  const user = getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vigorix_store')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message || 'Erro ao buscar dados');
  return data || [];
}

export async function getStoreRecord(key) {
  const user = getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('vigorix_store')
    .select('*')
    .eq('user_id', user.id)
    .eq('key', key)
    .maybeSingle();

  if (error) return null;
  return data || null;
}

export async function upsertStoreRecord(key, dataObj) {
  const user = getUser();
  if (!user) throw new Error('Não logado');

  const payload = {
    user_id: user.id,
    key: key,
    data: dataObj,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('vigorix_store')
    .upsert(payload, { onConflict: 'user_id,key' })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Erro ao salvar no banco');
  return data;
}
