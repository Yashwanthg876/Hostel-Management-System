'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function SLAPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // Update time every minute to keep 'time remaining' accurate
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/complaints', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) setComplaints(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel('sla-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    const breached = complaints.filter(c => c.status === 'ESCALATED');
    const atRisk = complaints.filter(c => {
        if (!c.slaDeadline || c.status === 'RESOLVED' || c.status === 'ESCALATED') return false;
        const deadline = new Date(c.slaDeadline).getTime();
        // Use state 'now' to satisfy purity rules
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return hoursLeft < 4; // Less than 4 hours left
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                    SLA Monitoring
                </h1>
                <p className="text-slate-500">Track breaches and high-risk tickets requiring immediate attention.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Escalated / Breached
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-red-800">{breached.length}</div>
                        <p className="text-sm text-red-600">Tickets that have exceeded their deadline.</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            At Risk (&lt; 4 Hours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-orange-800">{atRisk.length}</div>
                        <p className="text-sm text-orange-600">Tickets nearing their deadline.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle>Critical Attention Required</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Time Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...breached, ...atRisk].length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        No critical issues at the moment. Good job! 🎉
                                    </TableCell>
                                </TableRow>
                            ) : (
                                [...breached, ...atRisk].map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Badge className={cn(
                                                c.status === 'ESCALATED' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                                    "bg-orange-100 text-orange-700 hover:bg-orange-100"
                                            )}>
                                                {c.status === 'ESCALATED' ? 'BREACHED' : 'AT RISK'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{c.title}</div>
                                            <div className="text-xs text-slate-500">{c.location}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{c.category}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm w-[200px]">
                                            {c.slaDeadline ? (
                                                <span className={cn(
                                                    c.status === 'ESCALATED' ? "text-red-600 font-bold" : "text-orange-600 font-semibold"
                                                )}>
                                                    {new Date(c.slaDeadline).toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
