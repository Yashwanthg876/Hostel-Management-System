'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, MapPin, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffTaskDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState('');

    const fetchComplaint = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        // We'll just fetch all and find the one (inefficient but safe for now) or use single fetch if API supports
        // Let's assume /api/complaints doesn't support ID fetch yet, or we filter locally.
        const res = await fetch('/api/complaints', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
            const data: Complaint[] = await res.json();
            const found = data.find(c => c.id === id);
            setComplaint(found || null);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        if (id) fetchComplaint();
    }, [id, fetchComplaint]);

    const handleStatusUpdate = async (newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
        if (!complaint) return;
        const { data: { session } } = await supabase.auth.getSession();

        await fetch('/api/complaints', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
                id: complaint.id,
                status: newStatus,
                // In a real app, we'd append remarks to a notes field
            })
        });
        router.push('/staff'); // Go back to overview
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!complaint) return <div className="p-8">Task not found.</div>;

    return (
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            <Button variant="ghost" className="pl-0 gap-2 mb-4" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back to Tasks
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{complaint.title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {complaint.location}
                    </div>
                </div>
                <Badge className={cn(
                    "px-3 py-1",
                    complaint.priorityScore > 70 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                    Score: {complaint.priorityScore}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">Description</label>
                                <p className="text-slate-700 mt-1">{complaint.description || "No description provided."}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Category</label>
                                    <p className="text-slate-900 mt-1 capitalize">{complaint.category.toLowerCase()}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Reported By</label>
                                    <p className="text-slate-900 mt-1 flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {complaint.userId ? "Student" : "Anonymous"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Action</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add maintenance notes or remarks here..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleStatusUpdate('RESOLVED')}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Resolved
                                </Button>
                                {complaint.status !== 'IN_PROGRESS' && (
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                    >
                                        <Clock className="mr-2 h-4 w-4" />
                                        In Progress
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className={cn(
                        "border-l-4",
                        complaint.slaDeadline && new Date() > new Date(complaint.slaDeadline)
                            ? "border-l-red-500 bg-red-50"
                            : "border-l-blue-500 bg-blue-50"
                    )}>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> SLA Status
                            </h3>
                            <div className="mt-2 text-sm">
                                <p className="text-slate-600">Deadline:</p>
                                <p className="font-mono font-medium text-slate-900">
                                    {complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString() : "None"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
