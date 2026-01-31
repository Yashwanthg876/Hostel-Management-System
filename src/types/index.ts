export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type Category =
    | 'Air Conditioner (AC)'
    | 'Carpentry'
    | 'CCTV Complaints'
    | 'Civil Maintenance'
    | 'Electrical Maintenance'
    | 'Facility Management'
    | 'Hostel AC Complaint'
    | 'Hostel Caretaker / Assistant wa'
    | 'Hostel Carpentry Work'
    | 'Hostel Electrical Work'
    | 'Hostel Food & Service'
    | 'Hostel Housekeeping'
    | 'Hostel Laundry Service'
    | 'Hostel Mess Hall Cleanliness'
    | 'Hostel Plumbing Work'
    | 'Hostel Wifi'
    | 'KMCH Medical Equipment'
    | 'Network and Internet'
    | 'Plumbing'
    | 'Printer Service'
    | 'System Service'
    | 'Toner Refilling'
    | 'Website Updates';

export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface Complaint {
    id: string;
    title: string;
    description: string;
    category: Category;
    severity: Severity;
    location: string;
    status: Status;
    priorityScore: number;
    userId: string;
    createdAt: string; // ISO string
    updatedAt: string;
    slaDeadline?: string;
    imageUrl?: string;
}

export type EventType =
    | 'ComplaintRaised'
    | 'PriorityCalculated'
    | 'SLATimerStarted'
    | 'StatusUpdated'
    | 'SLABreached'
    | 'ComplaintEscalated'
    | 'ComplaintResolved';

export interface AppEvent {
    id: string;
    type: EventType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    timestamp: string;
    complaintId?: string;
}

export const SLA_RULES: Record<Category, number> = {
    'Air Conditioner (AC)': 4,
    'Carpentry': 24,
    'CCTV Complaints': 4,
    'Civil Maintenance': 24,
    'Electrical Maintenance': 4,
    'Facility Management': 48,
    'Hostel AC Complaint': 4,
    'Hostel Caretaker / Assistant wa': 12,
    'Hostel Carpentry Work': 24,
    'Hostel Electrical Work': 4,
    'Hostel Food & Service': 12,
    'Hostel Housekeeping': 12,
    'Hostel Laundry Service': 24,
    'Hostel Mess Hall Cleanliness': 12,
    'Hostel Plumbing Work': 4,
    'Hostel Wifi': 4,
    'KMCH Medical Equipment': 1,
    'Network and Internet': 4,
    'Plumbing': 4,
    'Printer Service': 48,
    'System Service': 48,
    'Toner Refilling': 48,
    'Website Updates': 72
};
