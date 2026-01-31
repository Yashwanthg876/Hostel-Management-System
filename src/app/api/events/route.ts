import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    // Fetch last 50 events
    let events;
    try {
        const { data, error: supabaseError } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (supabaseError) {
            return NextResponse.json({ error: supabaseError.message }, { status: 500 });
        }
        events = data;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = events.map((e: any) => ({
        id: e.id,
        type: e.type,
        payload: typeof e.payload === 'string' ? e.payload : JSON.stringify(e.payload),
        timestamp: e.created_at
    }));

    return NextResponse.json(mapped);
}
