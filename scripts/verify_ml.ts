import { predictSeverity, analyzeTrend, getClassifier } from '../src/lib/ml/classifier';
import { calculateSmartPriority } from '../src/lib/priority';

async function verifyML() {
    console.log("🤖 Verifying ML & Priority Engine...\n");

    // 1. Test NLP Classifier (Severity Prediction)
    console.log("1️⃣ Testing Severity Prediction:");
    const testCases = [
        { text: "There is a fire in the room!", expected: "HIGH" },
        { text: "The tap is leaking slowly", expected: "MEDIUM" },
        { text: "My chair is squeaking", expected: "LOW" },
        { text: "Smoke coming from the switchboard", expected: "HIGH" },
        { text: "water is flooded in our room", expected: "HIGH" },
        { text: "Need pest control for ants", expected: "LOW" }
    ];

    // Ensure classifier is trained
    getClassifier();

    let mlPass = true;
    testCases.forEach(({ text, expected }) => {
        const result = predictSeverity(text);
        const match = result === expected;
        console.log(`   "${text}" -> Predicted: ${result} | Expected: ${expected} [${match ? '✅' : '❌'}]`);
        if (!match) mlPass = false;
    });

    // 2. Test Smart Priority Logic
    console.log("\n2️⃣ Testing Smart Priority Engine:");
    // Case A: User Cry Wolf (User: Critical, AI: Low)
    const scoreA = calculateSmartPriority('Critical', 'LOW', 48);
    // Case B: Real Emergency (User: Critical, AI: High)
    const scoreB = calculateSmartPriority('Critical', 'HIGH', 1);

    console.log(`   Case A (Cry Wolf): User=Critical, AI=Low, SLA=48h -> Score: ${scoreA}`);
    console.log(`   Case B (Real Fire): User=Critical, AI=High, SLA=1h  -> Score: ${scoreB}`);

    if (scoreB > scoreA) {
        console.log("   ✅ Logic Verified: Real emergency scored higher than 'cry wolf'.");
    } else {
        console.log("   ❌ Logic Failed: Scores are not aligned with severity.");
    }

    // 3. Test Predictive Insights
    console.log("\n3️⃣ Testing Predictive Insights:");
    const dummyComplaints = [
        { created_at: '2023-10-02T10:00:00Z' }, // Monday
        { created_at: '2023-10-09T10:00:00Z' }, // Monday
        { created_at: '2023-10-16T10:00:00Z' }, // Monday
        { created_at: '2023-10-03T10:00:00Z' }, // Tuesday
    ];
    const insight = analyzeTrend(dummyComplaints);
    console.log(`   Input: 3 Mondays, 1 Tuesday`);
    console.log(`   Output: Riskiest Day -> ${insight.riskiestDay}`);
    console.log(`   Observation -> ${insight.observation}`);

    if (insight.riskiestDay === 'Monday') {
        console.log("   ✅ trend analysis correct.");
    } else {
        console.log("   ❌ trend analysis failed.");
    }
}

verifyML();
