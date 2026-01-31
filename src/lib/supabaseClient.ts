import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    // We don't want to crash build time if envs are missing
    console.warn("Supabase URL or Key missing. Check .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
