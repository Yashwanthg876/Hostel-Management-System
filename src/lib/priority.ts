import { Category } from '@/types';

// Hybrid Priority Calculation
// Score = (Base Severity Score + (ML Severity Score * 1.5)) + SLA Factor
export const calculateSmartPriority = (
    userSeverity: string,
    mlSeverity: 'HIGH' | 'MEDIUM' | 'LOW',
    slaHours: number
): number => {
    const severityMap: Record<string, number> = {
        'Critical': 50,
        'HIGH': 40,   // ML Output uppercase
        'High': 40,
        'MEDIUM': 20, // ML Output uppercase
        'Medium': 20,
        'LOW': 10,    // ML Output uppercase
        'Low': 10
    };

    const userScore = severityMap[userSeverity] || 10;
    const mlScore = severityMap[mlSeverity] || 10;

    // Weighted Average: Machine's opinion matters 1.5x more than user (who might exaggerate)
    const baseScore = (userScore + (mlScore * 1.5)) / 2; // Normalize slightly

    let finalScore = baseScore;

    // SLA Time Factor: Closer deadline = Higher urgency
    if (slaHours <= 1) finalScore += 50;      // Immediate danger
    else if (slaHours <= 4) finalScore += 30; // Urgent
    else if (slaHours <= 12) finalScore += 10; // Same day

    // Cap at 100
    return Math.min(Math.round(finalScore * 2), 100); // Scale up to 0-100 range
};

export const getBaseSeverityAndSLA = (category: string) => {
    const rules: Record<string, { severity: string, sla: number }> = {
        'Air Conditioner (AC)': { severity: 'High', sla: 4 },
        'Carpentry': { severity: 'Medium', sla: 24 },
        'CCTV Complaints': { severity: 'High', sla: 4 },
        'Civil Maintenance': { severity: 'Medium', sla: 24 },
        'Electrical Maintenance': { severity: 'High', sla: 4 },
        'Facility Management': { severity: 'Low', sla: 48 },
        'Hostel AC Complaint': { severity: 'High', sla: 4 },
        'Hostel Caretaker / Assistant wa': { severity: 'Medium', sla: 12 },
        'Hostel Carpentry Work': { severity: 'Medium', sla: 24 },
        'Hostel Electrical Work': { severity: 'High', sla: 4 },
        'Hostel Food & Service': { severity: 'Medium', sla: 12 },
        'Hostel Housekeeping': { severity: 'Medium', sla: 12 },
        'Hostel Laundry Service': { severity: 'Medium', sla: 24 },
        'Hostel Mess Hall Cleanliness': { severity: 'Medium', sla: 12 },
        'Hostel Plumbing Work': { severity: 'High', sla: 4 },
        'Hostel Wifi': { severity: 'High', sla: 4 },
        'KMCH Medical Equipment': { severity: 'Critical', sla: 1 },
        'Network and Internet': { severity: 'High', sla: 4 },
        'Plumbing': { severity: 'High', sla: 4 },
        'Printer Service': { severity: 'Low', sla: 48 },
        'System Service': { severity: 'Low', sla: 48 },
        'Toner Refilling': { severity: 'Low', sla: 48 },
        'Website Updates': { severity: 'Low', sla: 72 }
    };
    return rules[category] || { severity: 'Low', sla: 48 };
};
