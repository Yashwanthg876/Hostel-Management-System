import { db } from '@/lib/db';
import eventBus from '@/lib/event-bus';
import { Complaint, Category, Severity, SLA_RULES } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const ComplaintService = {
    async raiseComplaint(data: {
        title: string;
        description: string;
        category: Category;
        location: string;
        userId: string;
    }) {
        // 1. Initial Logic
        const id = uuidv4();
        const now = new Date();
        const slaHours = SLA_RULES[data.category];
        const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

        // 2. Create Complaint Object
        const complaint: Complaint = {
            id,
            ...data,
            severity: 'Medium', // Default, will be recalculated
            status: 'OPEN',
            priorityScore: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            slaDeadline: slaDeadline.toISOString(),
        };

        // 3. Save to DB
        await db.complaints.create(complaint);

        // 4. Emit Event
        eventBus.emit('ComplaintRaised', complaint);

        // Log Event
        await db.events.create({
            id: uuidv4(),
            type: 'ComplaintRaised',
            payload: JSON.stringify(complaint),
            timestamp: new Date().toISOString(),
            complaintId: id
        });

        return complaint;
    },

    async getAllComplaints() {
        return db.complaints.getAll();
    },

    async getComplaintById(id: string) {
        return db.complaints.getById(id);
    }
};
