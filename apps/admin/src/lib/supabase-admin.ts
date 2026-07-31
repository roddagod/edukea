import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Client Supabase avec service_role — ADMIN ONLY, jamais cote client.
 * Utilise process.env.SUPABASE_SERVICE_ROLE_KEY.
 */
export function getAdminClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}