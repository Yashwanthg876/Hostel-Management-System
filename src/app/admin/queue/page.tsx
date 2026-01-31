'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils';
import { Search, CheckCircle, ImageIcon } from 'lucide-react';

export default function LiveQueuePage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/complaints', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) setComplaints(await res.json());
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel('queue-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

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
        fetchData();
    };

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

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live Priority Queue</h1>
                    <p className="text-slate-500">Real-time list of active complaints sorted by urgency.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>Ticket Registry</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    className="h-9 w-64 rounded-md border border-slate-200 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-9 rounded-md border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="OPEN">Open Only</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Score</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Evidence</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredComplaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredComplaints.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    c.priorityScore > 80 ? "bg-red-500" :
                                                        c.priorityScore > 50 ? "bg-orange-500" : "bg-green-500"
                                                )} />
                                                {c.priorityScore}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{c.title}</div>
                                            <div className="text-xs text-slate-500">{c.location}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{c.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {c.imageUrl ? (
                                                <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded overflow-hidden border hover:border-blue-500 transition-colors">
                                                    <img src={c.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">No Img</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                c.status === 'RESOLVED' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                                    c.status === 'ESCALATED' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                                        "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                            )}>
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn("text-xs font-mono",
                                                c.slaDeadline && new Date() > new Date(c.slaDeadline) && c.status !== 'RESOLVED' ? "text-red-600 font-bold" : "text-slate-500"
                                            )}>
                                                {c.slaDeadline ? new Date(c.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {c.status !== 'RESOLVED' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                                                    title="Mark Resolved"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
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
