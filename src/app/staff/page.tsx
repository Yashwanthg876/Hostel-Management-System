'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, MapPin, CheckCircle, ArrowRight, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StaffOverviewPage() {
    const router = useRouter();
    const [topTask, setTopTask] = useState<Complaint | null>(null);
    const [stats, setStats] = useState({ pending: 0, completedToday: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        // Fetch all non-resolved complaints
        const res = await fetch('/api/complaints', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });

        if (res.ok) {
            const allComplaints: Complaint[] = await res.json();

            // Logic for "My Top Task":
            // 1. Filter for complaints not resolved
            // 2. Sort by priorityScore (descending)
            // 3. Take the first one
            const active = allComplaints.filter(c => c.status !== 'RESOLVED');
            const sorted = active.sort((a, b) => b.priorityScore - a.priorityScore);

            if (sorted.length > 0) {
                setTopTask(sorted[0]);
            } else {
                setTopTask(null);
            }

            // Calculate basic stats
            const completed = allComplaints.filter(c => c.status === 'RESOLVED').length; // Ideally filter by date too
            setStats({
                pending: active.length,
                completedToday: completed // Simplified for demo
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel('staff-overview')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const [now] = useState(Date.now()); // Stable reference for render

    const getTimeRemaining = (deadline?: string) => {
        if (!deadline) return null;
        const diff = new Date(deadline).getTime() - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 0) return "Overdue";
        return `${hours}h remaining`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6 md:space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good Morning! ☀️</h1>
                <p className="text-slate-500">Here is your mission critical for today.</p>
            </div>

            {/* Top Priority Task Hero Card */}
            {topTask ? (
                <Card className="border-2 border-orange-500 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 uppercase tracking-wide">
                                🔥 Top Priority
                            </Badge>
                            <span className="text-sm font-mono text-slate-400">#{topTask.id.slice(0, 8)}</span>
                        </div>
                        <CardTitle className="text-2xl mt-2">{topTask.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4" />
                            {topTask.location}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-600 font-medium">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                Score: {topTask.priorityScore}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full font-medium",
                                topTask.slaDeadline && new Date() > new Date(topTask.slaDeadline) ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            )}>
                                <Clock className="h-4 w-4" />
                                {getTimeRemaining(topTask.slaDeadline)}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-slate-700 leading-relaxed">
                                {topTask.description || "No specific details provided. Please investigate the site immediately."}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                size="lg"
                                onClick={() => router.push(`/staff/tasks/${topTask.id}`)}
                            >
                                Start Job <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-emerald-800">
                        <CheckCircle className="h-12 w-12 mb-4 text-emerald-600" />
                        <h3 className="text-xl font-bold">All Clear!</h3>
                        <p className="text-emerald-700">No pending high-priority tasks. Enjoy your break! ☕</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Tasks</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                        </div>
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Fixed Today</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.completedToday}</p>
                        </div>
                        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
