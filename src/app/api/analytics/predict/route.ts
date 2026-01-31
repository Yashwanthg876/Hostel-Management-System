import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeTrend } from '@/lib/ml/classifier';

export async function GET(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch last 100 complaints for analysis
    const { data: complaints, error } = await supabase
        .from('complaints')
        .select('created_at, category')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const insight = analyzeTrend(complaints || []);

    return NextResponse.json(insight);
}
