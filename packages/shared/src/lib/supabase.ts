import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Client Supabase partagé.
 *
 * En browser (Next.js SSR context) : createBrowserClient depuis `@supabase/ssr`
 * pour partager les cookies de session avec le middleware Next.js.
 *
 * En environnement Node/Expo (mobile) : fallback sur le createClient de base
 * (session gérée via localStorage / AsyncStorage suivant le runtime).
 *
 * Cette détection permet aux hooks (useAuth, useSchoolTreasury, etc.) de consommer
 * la session Supabase authentifiée sans que chaque app ait à injecter son propre client.
 */
export const supabase: SupabaseClient =
  typeof document !== 'undefined'
    ? (createBrowserClient(supabaseUrl, supabaseAnonKey) as unknown as SupabaseClient)
    : createClient(supabaseUrl, supabaseAnonKey);

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey);
}
