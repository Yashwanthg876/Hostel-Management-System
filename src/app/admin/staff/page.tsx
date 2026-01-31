'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, UserCog, Shield } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type Profile = {
    id: string;
    email: string;
    full_name: string;
    role: 'STUDENT' | 'STAFF' | 'ADMIN';
    created_at: string;
};

export default function StaffPage() {
    const [staff, setStaff] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['STAFF', 'ADMIN'])
                .order('role', { ascending: true }); // Admin first (alphabetical)

            if (data) setStaff(data as Profile[]);
            setLoading(false);
        };
        fetchStaff();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <UserCog className="h-8 w-8 text-blue-600" />
                    Staff Management
                </h1>
                <p className="text-slate-500">Overview of maintenance team and administrators.</p>
            </div>

            <Card>
                <CardHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>Team Roster</CardTitle>
                        <Button size="sm" variant="outline">
                            invite New Staff
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Name / Email</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No staff found. (Are you the only one?)
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <Badge className={member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}>
                                                {member.role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{member.full_name || 'N/A'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {member.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" className="text-slate-400">
                                                Edit
                                            </Button>
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
