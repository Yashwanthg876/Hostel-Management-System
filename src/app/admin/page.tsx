'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint, AppEvent } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, Activity, ArrowUpCircle, CheckCircle, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminDashboard() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {
                'Authorization': `Bearer ${session?.access_token}`
            };

            const cRes = await fetch('/api/complaints', { headers });
            if (cRes.ok) setComplaints(await cRes.json());

            const eRes = await fetch('/api/events', { headers });
            if (eRes.ok) setEvents((await eRes.json()).reverse());

            await fetch('/api/cron'); // Trigger backend check
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // ... (realtime logic)

        const channel = supabase
            .channel('realtime-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
                console.log('New Event:', payload);
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/complaints', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ id, status: newStatus })
        });
        fetchData(); // Optimistic update would be better, but refetch is safe
    };

    // Filtering & Sorting
    const filteredComplaints = complaints
        .filter(c => {
            if (filterStatus === 'OPEN') return c.status !== 'RESOLVED';
            if (filterStatus === 'RESOLVED') return c.status === 'RESOLVED';
            return true;
        })
        .filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.location.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Calculate Metrics
    const activeComplaints = complaints.filter(c => c.status !== 'RESOLVED');
    const slaBreaches = complaints.filter(c => c.status === 'ESCALATED').length;
    const avgScore = complaints.length > 0 ? (complaints.reduce((acc, c) => acc + c.priorityScore, 0) / complaints.length).toFixed(0) : 0;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mission Control</h1>
                    <p className="text-slate-500">Real-time oversight of hostel maintenance tickets.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetch('/api/simulation', { method: 'POST', body: JSON.stringify({ action: 'FAST_FORWARD', hours: 1 }) })}>
                        ⏩ +1 Hour
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => fetch('/api/simulation', { method: 'POST', body: JSON.stringify({ action: 'GENERATE_BURST' }) })}>
                        💥 Chaos Mode
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeComplaints.length}</div>
                        <p className="text-xs text-muted-foreground">Open tickets requiring action</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Priority Score</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore}</div>
                        <p className="text-xs text-muted-foreground">Overall system urgency</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{slaBreaches}</div>
                        <p className="text-xs text-muted-foreground">Critical overdue tickets</p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown (New) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(complaints.reduce((acc, c) => {
                    acc[c.category] = (acc[c.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)).map(([cat, count]) => (
                    <Card key={cat} className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-slate-700">{count}</span>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{cat}</span>
                            <div className="w-full bg-slate-200 h-1 mt-3 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: `${(count / complaints.length) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* End of Overview Stats */}
        </div>

    );
}
