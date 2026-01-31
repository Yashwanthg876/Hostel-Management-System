import { db } from '@/lib/db';
import eventBus from '@/lib/event-bus';
import { Complaint, Severity } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const PriorityService = {
    calculateScore(complaint: Complaint): number {
        let score = 0;

        // Severity Weight
        const severityWeights: Record<Severity, number> = {
            Critical: 100,
            High: 70,
            Medium: 40,
            Low: 10,
        };
        score += severityWeights[complaint.severity];

        // Time Factor (Approaching SLA)
        if (complaint.slaDeadline) {
            const deadline = new Date(complaint.slaDeadline).getTime();
            const now = new Date().getTime();
            const timeLeftHours = (deadline - now) / (1000 * 60 * 60);

            if (timeLeftHours < 0) score += 50; // SLA Breached
            else if (timeLeftHours < 1) score += 30; // Critical Time
            else if (timeLeftHours < 4) score += 10;
        }

        return score;
    },

    async updatePriority(complaintId: string) {
        const complaint = await db.complaints.getById(complaintId);
        if (!complaint) return;

        const newScore = this.calculateScore(complaint);

        // Determine if Severity Update is needed (Mock logic: elevate severity if score is high)
        let newSeverity = complaint.severity;
        if (newScore > 130) newSeverity = 'Critical';
        else if (newScore > 90 && newSeverity !== 'Critical') newSeverity = 'High';

        if (complaint.priorityScore !== newScore || complaint.severity !== newSeverity) {
            const updated = await db.complaints.update(complaintId, {
                priorityScore: newScore,
                severity: newSeverity,
                updatedAt: new Date().toISOString()
            });

            if (updated) {
                eventBus.emit('PriorityCalculated', updated);
                await db.events.create({
                    id: uuidv4(),
                    type: 'PriorityCalculated',
                    payload: JSON.stringify({ oldScore: complaint.priorityScore, newScore }),
                    timestamp: new Date().toISOString(),
                    complaintId
                });
            }
        }
    }
};

// Listen to events
eventBus.on('ComplaintRaised', async (complaint: Complaint) => {
    // Initial priority calculation
    console.log(`[PriorityService] Calculating initial priority for ${complaint.id}`);
    await PriorityService.updatePriority(complaint.id);
});
