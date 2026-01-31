import { db } from '@/lib/db';
import eventBus from '@/lib/event-bus';
import { PriorityService } from './priority-service';
import { v4 as uuidv4 } from 'uuid';

export const SLAService = {
    async checkBreaches() {
        const complaints = await db.complaints.getAll();
        const now = new Date();

        for (const c of complaints) {
            if (c.status === 'RESOLVED' || c.status === 'ESCALATED') continue;
            if (!c.slaDeadline) continue;

            const deadline = new Date(c.slaDeadline);

            if (now > deadline) {
                // Breached!
                console.log(`[SLAService] Breach detected for ${c.id}`);

                // Update Status
                const updated = await db.complaints.update(c.id, { status: 'ESCALATED' }); // Or keep status but flag it

                if (updated) {
                    eventBus.emit('SLABreached', updated);
                    await db.events.create({
                        id: uuidv4(),
                        type: 'SLABreached',
                        payload: JSON.stringify({ overdueBy: (now.getTime() - deadline.getTime()) / 1000 }),
                        timestamp: now.toISOString(),
                        complaintId: c.id
                    });

                    // Recalculate Priority immediately
                    await PriorityService.updatePriority(c.id);
                }
            }
        }
    }
};

// Ideally, this runs on a timer. In Next.js, we can use an interval in a singleton or call this via an API route.
