'use client';

import { useState, useEffect } from 'react';
import { Category, Complaint } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, History, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function StudentPortalPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        category: 'Electrical Maintenance' as Category,
        location: '',
        description: '',
        imageUrl: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [uploading, setUploading] = useState(false);
    const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [stats, setStats] = useState({ active: 0, resolved: 0 });

    // Fetch History & Subscribe to Updates
    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            // Using direct Supabase query to leverage RLS (Row Level Security)
            // The API route is also fine, but this is often faster for "My Data"
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Map snake_case to camelCase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped = data.map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    category: c.category,
                    severity: c.severity,
                    status: c.status,
                    priorityScore: c.priority_score,
                    location: c.location,
                    slaDeadline: c.sla_deadline,
                    createdAt: c.created_at,
                    updatedAt: c.created_at, // Fallback as we don't track update time yet
                    userId: c.user_id
                }));
                setMyComplaints(mapped);

                // Calculate Stats
                const active = mapped.filter((c: any) => c.status !== 'RESOLVED').length;
                const resolved = mapped.filter((c: any) => c.status === 'RESOLVED').length;
                setStats({ active, resolved });
            }
            setLoadingHistory(false);
        };

        fetchHistory();

        // Realtime Subscription
        const channel = supabase
            .channel('student-complaints')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'complaints',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Realtime update:', payload);
                    fetchHistory(); // Refresh list on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }

    }, [user]);

    const uploadImage = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('evidence')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('evidence').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }
        const file = e.target.files[0];
        const url = await uploadImage(file);
        if (url) {
            setFormData({ ...formData, imageUrl: url });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setStatus('submitting');

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ ...formData, userId: user.id }),
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ title: '', category: 'Electrical Maintenance', location: '', description: '', imageUrl: '' });
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'ESCALATED': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Portal</h1>
                        <p className="text-slate-500 mt-2">Manage your maintenance requests and track their status.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                <Activity className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Active</p>
                                <p className="text-xl font-bold text-slate-900">{stats.active}</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-full">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Resolved</p>
                                <p className="text-xl font-bold text-slate-900">{stats.resolved}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form (1/3 width on large screens) */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-t-4 border-t-blue-500 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    New Request
                                </CardTitle>
                                <CardDescription>Log a new issue.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Category</label>
                                        <select
                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                                        >
                                            {[
                                                'Air Conditioner (AC)', 'Carpentry', 'CCTV Complaints', 'Civil Maintenance',
                                                'Electrical Maintenance', 'Facility Management', 'Hostel AC Complaint',
                                                'Hostel Caretaker / Assistant wa', 'Hostel Carpentry Work', 'Hostel Electrical Work',
                                                'Hostel Food & Service', 'Hostel Housekeeping', 'Hostel Laundry Service',
                                                'Hostel Mess Hall Cleanliness', 'Hostel Plumbing Work', 'Hostel Wifi',
                                                'KMCH Medical Equipment', 'Network and Internet', 'Plumbing',
                                                'Printer Service', 'System Service', 'Toner Refilling', 'Website Updates'
                                            ].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Room 302"
                                            required
                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Issue Title</label>
                                        <input
                                            type="text"
                                            placeholder="Brief summary"
                                            required
                                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Details..."
                                            required
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Evidence (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                                                <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            {formData.imageUrl && (
                                                <div className="relative w-10 h-10 rounded overflow-hidden border">
                                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {formData.imageUrl && <span className="text-xs text-green-600 font-medium">Attached!</span>}
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                                        {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
                                    </Button>

                                    {status === 'success' && (
                                        <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded text-xs font-medium animate-in fade-in">
                                            <CheckCircle2 className="h-3 w-3" /> Ticket generated!
                                        </div>
                                    )}
                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded text-xs font-medium animate-in fade-in">
                                            <AlertCircle className="h-3 w-3" /> Submission failed.
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: History (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-500" />
                                My Request History
                            </h2>
                            <span className="text-sm text-slate-500">
                                {myComplaints.length} Records
                            </span>
                        </div>

                        {loadingHistory ? (
                            <div className="text-center py-12 text-slate-400">Loading history...</div>
                        ) : myComplaints.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <Clock className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">No requests yet</h3>
                                <p className="text-xs text-slate-500 mt-1">Submit your first maintenance request to see it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {myComplaints.map((complaint) => (
                                        <motion.div
                                            key={complaint.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4 flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-slate-900">{complaint.title}</h3>
                                                            <Badge variant="secondary" className="text-[10px] font-normal">
                                                                {complaint.category}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-500 line-clamp-1">{complaint.description}</p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                                            <span>📍 {complaint.location}</span>
                                                            <span>📅 {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                                                            {complaint.status}
                                                        </span>
                                                        {complaint.status === 'RESOLVED' && (
                                                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> Done
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
