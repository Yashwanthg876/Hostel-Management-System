'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MapPin, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MyTasksPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/complaints', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
            const data: Complaint[] = await res.json();
            // Sort by Priority Score descending
            setComplaints(data.sort((a, b) => b.priorityScore - a.priorityScore));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel('staff-tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    // Helper to group by status
    const pending = complaints.filter(c => c.status !== 'RESOLVED');
    const resolved = complaints.filter(c => c.status === 'RESOLVED');

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Work Order List</h1>
                <p className="text-slate-500">All assigned maintenance tasks.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Jobs ({pending.length})</h2>
                {pending.map((c) => (
                    <Link key={c.id} href={`/staff/tasks/${c.id}`}>
                        <Card className="hover:shadow-md transition-shadow border-slate-200">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">{c.title}</h3>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            c.priorityScore > 70 ? "border-red-200 text-red-600 bg-red-50" : "border-slate-200 text-slate-500"
                                        )}>
                                            Score: {c.priorityScore}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {c.location}
                                        <span className="text-slate-300">•</span>
                                        <span className="capitalize">{c.category.toLowerCase()}</span>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {pending.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500 mt-1">You&apos;re all caught up!</p>
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-8">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed History</h2>
                {resolved.map((c) => (
                    <Card key={c.id} className="bg-slate-50/50 opacity-75 grayscale hover:grayscale-0 transition-all">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium text-slate-700 line-through">{c.title}</h3>
                                <div className="text-sm text-slate-500">{c.location}</div>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
