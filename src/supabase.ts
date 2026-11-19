import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null when the env vars are missing: the public site still works with the built-in content. */
export const db = url && key ? createClient(url, key) : null;
