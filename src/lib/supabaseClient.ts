import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Warn during build/dev if actual keys are missing
    console.warn("⚠️ Supabase Keys missing! Using placeholders to prevent build crash.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
