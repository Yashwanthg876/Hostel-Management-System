import * as fs from 'fs';
import * as path from 'path';

// Vocabulary Lists
const locations = ["in my room", "in the bathroom", "in the corridor", "in the common area", "in the pantry", "on the 2nd floor", "near the entrance", "in block A", ""];

// HIGH SEVERITY (Safety, Power, Water Damage)
const high_subjects = ["fire", "smoke", "sparking", "short circuit", "gas leak", "explosion", "burning smell", "exposed wire", "flooding", "burst pipe", "ceiling collapse", "broken glass", "main door broken", "lock broken", "elevator stuck", "no electricity"];
const high_verbs = ["detected", "happening", "started", "coming out", "is dangerous", "exploded", "collapsed", "shattered", "not locking", "stuck with people"];
const high_urgent = ["emergency", "urgent help needed", "danger", "critical situation", "help immediately"];

// MEDIUM SEVERITY (Functional, Comfort)
const med_subjects = ["fan", "light", "tube light", "ac", "air conditioner", "cooler", "water tap", "shower", "flush", "sink", "internet", "wifi", "lan port", "bed", "mattress", "table", "chair", "cupboard"];
const med_verbs = ["not working", "broken", "leaking", "dripping", "slow", "flickering", "making noise", "wobbly", "jammed", "clogged", "no water", "very slow", "disconnected"];

// LOW SEVERITY (Cosmetic, Minor)
const low_subjects = ["curtain", "curtain rod", "mirror", "dustbin", "paint", "wall", "floor tile", "window net", "notice board", "doormat", "soap stand", "towel rail"];
const low_verbs = ["dirty", "stained", "peeling off", "missing", "torn", "loose", "dusty", "needs cleaning", "slightly broken", "old"];

const dataset: { text: string, label: string }[] = [];

function addEntry(text: string, label: string) {
    dataset.push({ text: text.trim(), label });
}

// GENERATE HIGH
high_subjects.forEach(sub => {
    high_verbs.forEach(verb => {
        addEntry(`${sub} ${verb}`, "HIGH");
        locations.forEach(loc => {
            if (Math.random() > 0.7) addEntry(`${sub} ${verb} ${loc}`, "HIGH");
        });
    });
    high_urgent.forEach(urg => {
        addEntry(`${urg} ${sub}`, "HIGH");
    });
});

// GENERATE MEDIUM
med_subjects.forEach(sub => {
    med_verbs.forEach(verb => {
        addEntry(`${sub} is ${verb}`, "MEDIUM");
        if (Math.random() > 0.5) addEntry(`${sub} ${verb}`, "MEDIUM");
        locations.forEach(loc => {
            if (Math.random() > 0.8) addEntry(`${sub} ${verb} ${loc}`, "MEDIUM");
        });
    });
});

// GENERATE LOW
low_subjects.forEach(sub => {
    low_verbs.forEach(verb => {
        addEntry(`${sub} is ${verb}`, "LOW");
        locations.forEach(loc => {
            if (Math.random() > 0.8) addEntry(`${sub} ${verb} ${loc}`, "LOW");
        });
    });
});

// Add some specific manual edge cases
addEntry("water is flooded in our room", "HIGH");
addEntry("room full of water", "HIGH");
addEntry("bathroom flooded", "HIGH");
addEntry(" lizard in room", "LOW");
addEntry("ants on the table", "LOW");

// Shuffle
const shuffled = dataset.sort(() => 0.5 - Math.random());

console.log(`Generated ${shuffled.length} unique training examples.`);

const outputPath = path.join(process.cwd(), 'src', 'lib', 'ml', 'training_data.json');
fs.writeFileSync(outputPath, JSON.stringify(shuffled, null, 4));
console.log(`Saved to ${outputPath}`);
