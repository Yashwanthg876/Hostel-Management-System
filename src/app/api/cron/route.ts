import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    const now = new Date().toISOString();

    // Find complaints that are OVERDUE and NOT YET ESCALATED
    const { data: overdue } = await supabase
        .from('complaints')
        .select('*')
        .lt('sla_deadline', now)
        .neq('status', 'ESCALATED')
        .neq('status', 'RESOLVED');

    if (!overdue || overdue.length === 0) {
        return NextResponse.json({ message: 'No breaches detected' });
    }

    const updates = overdue.map(async (c) => {
        // 1. Log Event
        await supabase.from('events').insert({
            type: 'SLABreached',
            payload: {
                id: c.id,
                title: c.title,
                message: `SLA Deadline passed by ${(Date.now() - new Date(c.sla_deadline).getTime()) / 1000}s`
            }
        });

        // 2. Escalate Complaint (Boost Priority)
        const newScore = (c.priority_score || 0) + 50; // Boost!

        await supabase.from('complaints').update({
            status: 'ESCALATED',
            priority_score: newScore
        }).eq('id', c.id);

        // 3. Log Priority Change
        await supabase.from('events').insert({
            type: 'PriorityCalculated',
            payload: {
                id: c.id,
                score: newScore,
                reason: 'SLA Breach Auto-Escalation'
            }
        });
    });

    await Promise.all(updates);

    return NextResponse.json({
        success: true,
        breaches: overdue.length,
        ids: overdue.map(c => c.id)
    });
}
