import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Complaint, Category } from '@/types';
import { predictSeverity } from '@/lib/ml/classifier';
import { calculateSmartPriority, getBaseSeverityAndSLA } from '@/lib/priority';
import { sendEmail, getComplaintConfirmationTemplate, getAdminAlertTemplate, getStatusUpdateTemplate } from '@/lib/email';
import * as fs from 'fs';
import * as path from 'path';

// DEBUG LOGGER
function logDebug(message: string, data?: any) {
    try {
        const logPath = path.join(process.cwd(), 'debug_antigravity.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        // Fallback
        console.error("Log Write Failed", e);
    }
}

// Helper to create authenticated client
const createAuthClient = (request: Request) => {
    const authHeader = request.headers.get('Authorization');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: authHeader ? { Authorization: authHeader } : {}
            }
        }
    );
};

export async function GET(request: Request) {
    const supabase = createAuthClient(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabase
        .from('complaints')
        .select('*')
        .order('priority_score', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data: complaints, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = complaints.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        severity: c.severity,
        status: c.status,
        priorityScore: c.priority_score,
        location: c.location,
        slaDeadline: c.sla_deadline,
        createdAt: c.created_at,
        userId: c.user_id
    }));

    return NextResponse.json(mapped);
}

export async function POST(request: Request) {
    const supabase = createAuthClient(request);

    try {
        // DEBUG LOGS
        const authHeader = request.headers.get('Authorization');
        logDebug("Auth Header Present:", { present: !!authHeader, length: authHeader?.length });

        const body = await request.json();
        const { title, description, category, location, userId, imageUrl } = body;

        logDebug("Payload:", { userId, category, location, hasImage: !!imageUrl });

        if (!title || !category || !location) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // 1. Get Static Rule Base
        const { severity: userSeverity, sla } = getBaseSeverityAndSLA(category);

        // 2. Get AI Prediction
        const combinedText = `${title} ${description || ''}`;
        const mlSeverity = predictSeverity(combinedText);

        // 3. Calculate Smart Score
        const priorityScore = calculateSmartPriority(userSeverity, mlSeverity, sla);
        const slaDeadline = new Date(Date.now() + sla * 60 * 60 * 1000).toISOString();

        // 4. Insert Complaint
        const { data: complaint, error: dbError } = await supabase
            .from('complaints')
            .insert({
                title,
                description,
                category,
                location,
                severity: userSeverity,
                priority_score: priorityScore,
                sla_deadline: slaDeadline,
                status: 'OPEN',
                user_id: userId,
                image_url: imageUrl // Store the URL
            })
            .select()
            .single();

        if (dbError) {
            logDebug("DB Insert Error", dbError);
            throw dbError;
        }

        // --- NEW: FETCH USER DETAILS FOR EMAIL ---
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (userProfile?.email) {
            // A. Send Confirmation to Student
            await sendEmail({
                to: userProfile.email,
                subject: `Ticket Received: ${complaint.title}`,
                html: getComplaintConfirmationTemplate(
                    userProfile.full_name || 'Student',
                    complaint.id,
                    `${sla} Hours`
                )
            });

            // C. Send Alert to Staff & Admin (if High Priority or High Severity)
            if (priorityScore >= 80 || complaint.severity === 'High' || complaint.severity === 'Critical') {

                // 1. Fetch Staff Emails
                const { data: staffMembers } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('role', 'STAFF');

                const staffEmails = staffMembers?.map(s => s.email).filter(Boolean) || [];
                const recipients = [...staffEmails, 'admin@hostel.com']; // Admin always gets it

                // 2. Send Emails in Parallel
                await Promise.all(recipients.map(email =>
                    sendEmail({
                        to: email,
                        subject: `🚨 STAFF ALERT: ${complaint.severity} Severity Complaint`,
                        html: getAdminAlertTemplate(complaint.id, category, priorityScore)
                    })
                ));
            }
        }
        // -----------------------------------------

        // 5. Log Events
        await supabase.from('events').insert({
            type: 'ComplaintRaised',
            payload: {
                id: complaint.id,
                title: complaint.title,
                severity: complaint.severity,
                message: `New complaint logged at ${location}`
            }
        });

        // Detailed Audit Log for Priority
        await supabase.from('events').insert({
            type: 'PriorityCalculated',
            payload: {
                id: complaint.id,
                score: priorityScore,
                details: {
                    ruleSeverity: userSeverity,
                    aiPrediction: mlSeverity,
                    slaHours: sla,
                    algorithm: 'Weighted Hybrid v2 (ML)'
                }
            }
        });

        return NextResponse.json(complaint);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        logDebug("Catch Block Error", error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = createAuthClient(request);

    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: "Missing ID or Status" }, { status: 400 });

        // 1. Update Complaint
        const { data: complaint, error } = await supabase
            .from('complaints')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // --- NEW: SEND STATUS UPDATE EMAIL ---
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', complaint.user_id)
            .single();

        if (userProfile?.email) {
            await sendEmail({
                to: userProfile.email,
                subject: `Update on Ticket ${complaint.id.substring(0, 8)}...`,
                html: getStatusUpdateTemplate(
                    userProfile.full_name || 'Student',
                    complaint.id,
                    status
                )
            });
        }
        // -------------------------------------

        // 2. Log Event
        await supabase.from('events').insert({
            type: 'ComplaintUpdated',
            payload: {
                id: complaint.id,
                status: complaint.status,
                message: `Status updated to ${status}`
            }
        });

        return NextResponse.json(complaint);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
