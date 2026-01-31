import natural from 'natural';
import trainingData from './training_data.json';

// Singleton to avoid retraining on every request
let classifier: natural.BayesClassifier | null = null;

export const getClassifier = () => {
    if (classifier) return classifier;

    const newClassifier = new natural.BayesClassifier();

    trainingData.forEach(item => {
        newClassifier.addDocument(item.text, item.label);
    });

    newClassifier.train();
    classifier = newClassifier;

    console.log("🧠 ML Model Trained Successfully");
    return classifier;
};

export const predictSeverity = (text: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
    const cls = getClassifier();
    const result = cls.classify(text);
    return result as 'HIGH' | 'MEDIUM' | 'LOW';
};

// Simple heuristic for future insights (Feature 3)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const analyzeTrend = (complaints: any[]) => {
    // In a real app, this would use regression.
    // Here we count day-of-week frequency.
    const dayCounts: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    complaints.forEach((c: any) => {
        const date = new Date(c.created_at);
        const day = days[date.getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Find max
    let maxDay = '';
    let maxCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxDay = day;
        }
    });

    return {
        riskiestDay: maxDay || 'Monday',
        observation: `Historical data indicates a surge in reports on ${maxDay || 'Monday'}s.`
    };
};
