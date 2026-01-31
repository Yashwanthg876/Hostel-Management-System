import { Complaint, AppEvent } from '@/types';

// Global store to persist across hot reloads in dev
const globalStore = global as unknown as {
    complaints: Complaint[];
    events: AppEvent[];
};

if (!globalStore.complaints) globalStore.complaints = [];
if (!globalStore.events) globalStore.events = [];

export const db = {
    complaints: {
        getAll: async () => [...globalStore.complaints],
        getById: async (id: string) => globalStore.complaints.find((c) => c.id === id),
        create: async (data: Complaint) => {
            globalStore.complaints.push(data);
            return data;
        },
        update: async (id: string, updates: Partial<Complaint>) => {
            const index = globalStore.complaints.findIndex((c) => c.id === id);
            if (index === -1) return null;
            globalStore.complaints[index] = { ...globalStore.complaints[index], ...updates };
            return globalStore.complaints[index];
        },
        delete: async (id: string) => {
            const index = globalStore.complaints.findIndex((c) => c.id === id);
            if (index > -1) {
                globalStore.complaints.splice(index, 1);
                return true;
            }
            return false;
        }
    },
    events: {
        getAll: async () => [...globalStore.events],
        create: async (event: AppEvent) => {
            globalStore.events.push(event);
            return event;
        },
        getByComplaintId: async (id: string) => globalStore.events.filter(e => e.complaintId === id)
    },
};
