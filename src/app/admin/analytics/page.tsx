'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [insight, setInsight] = useState<{ riskiestDay: string, observation: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Authorization': `Bearer ${session?.access_token}` };

        const [resParams, resPredict] = await Promise.all([
            fetch('/api/complaints', { headers }),
            fetch('/api/analytics/predict', { headers })
        ]);

        if (resParams.ok) setComplaints(await resParams.json());
        if (resPredict.ok) setInsight(await resPredict.json());

        setLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            // ... implementation moved here or kept mostly same but defined inside
            // Actually, fetchData sets state. Defining it inside is safest.
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers = { 'Authorization': `Bearer ${session?.access_token}` };

                const cRes = await fetch('/api/complaints', { headers });
                if (cRes.ok) setComplaints(await cRes.json());
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    // 1. Complaints by Category
    const categoryData = Object.entries(complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

    // 2. Complaints by Status
    const statusData = Object.entries(complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-indigo-600" />
                    Analytics & Insights
                </h1>
                <p className="text-slate-500">Data-driven view of hostel maintenance trends.</p>
            </div>

            {/* Feature 3: Predictive Insights Widget (ML) */}
            {insight && (
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <span className="text-2xl">🔮</span> AI Forecast
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium opacity-90">
                            {insight.observation}
                        </p>
                        <p className="text-sm mt-2 opacity-75">
                            Based on regression analysis of recent historical data.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issues by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart: Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RePieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
