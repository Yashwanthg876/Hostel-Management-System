import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase keys in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
    console.log("🚀 Starting System Verification...");
    const timestamp = Date.now();
    const email = 'verification_bot_v1@example.com';
    const password = 'password123';

    // 1. Test Authentication (SignIn or SignUp)
    console.log(`\n1️⃣ Testing Auth...`);

    // Try SignIn first
    let authResult = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authResult.error && authResult.error.message.includes('Invalid login credentials')) {
        console.log("   User not found, attempting SignUp...");
        authResult = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: 'Verification Bot', role: 'STUDENT' }
            }
        }) as any; // Cast to avoid strict type mismatch between SignIn/SignUp response structure if needed
    }

    const { data: authData, error: authError } = authResult;

    if (authError) {
        console.error("❌ Auth Failed:", authError.message);
        return;
    }
    console.log("✅ User Authenticated:", authData.user?.id);
    const userId = authData.user?.id;

    if (!userId) {
        console.error("❌ No User ID returned.");
        return;
    }

    // 2. Verify Profile Auto-Creation (Trigger)
    console.log(`\n2️⃣ Verifying Profile Trigger...`);
    // Allow a moment for trigger to run
    await new Promise(r => setTimeout(r, 2000));

    // We can't query profiles easily with anon key unless public read is on (which it is)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error("❌ Profile Check Failed:", profileError.message);
    } else if (profile) {
        console.log("✅ Profile Found:", profile.full_name, `(${profile.role})`);
    } else {
        console.error("❌ Profile missing (Trigger failed?)");
    }

    // 3. Test Complaint Submission (RLS Check)
    console.log(`\n3️⃣ Testing Complaint Submission...`);
    const { data: complaint, error: complaintError } = await supabase
        .from('complaints')
        .insert({
            title: `Test Verification ${timestamp}`,
            description: 'Automated test of backend systems',
            category: 'ELECTRICAL',
            location: 'Block A - Room 101',
            priorityScore: 50,
            user_id: userId // RLS requires this to match auth.uid()
        })
        .select()
        .single();

    if (complaintError) {
        console.error("❌ Create Complaint Failed:", complaintError.message);
    } else {
        console.log("✅ Complaint Created:", complaint.id);
    }

    // 4. Verify Event Logging (Triggers or API logic)
    // Note: If logic is in Next.js API, direct DB insert won't trigger event unless DB trigger exists.
    // Our 'complaints' API handles event creation. Since we inserted directly via Supabase client,
    // we bypass the Next.js API logic, BUT we may have DB triggers?
    // Let's check if the 'handle_new_complaint' DB trigger exists or if it's app logic.
    // Based on previous context, events are often created by the API.
    // However, let's just check if we can read the complaint back using the user session.

    console.log(`\n4️⃣ Verifying RLS Read Access...`);
    const { data: myComplaints, error: readError } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId);

    if (readError) {
        console.error("❌ Read Failed:", readError.message);
    } else if (myComplaints.length > 0) {
        console.log("✅ RLS Read Success: User can see their 1 complaint.");
    } else {
        console.error("❌ RLS Read Empty: User cannot see their own complaint.");
    }

    // Cleanup (Delete Test User if possible - usually requires Admin or Service Role)
    // We can try deleting the complaint at least
    console.log(`\n5️⃣ Cleanup...`);
    const { error: deleteError } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaint?.id || '');

    if (deleteError) {
        console.warn("⚠️ Cleanup Delete Complaint Failed (RLS might prevent delete?):", deleteError.message);
    } else {
        console.log("✅ Complaint Deleted.");
    }

    console.log("\nSearch for 'Test Bot' in Supabase Auth to manually delete the test user.");
}

runVerification();
