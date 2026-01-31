'use client';

export default function AnalyticsView() {
    return (
        <div className="py-10">
            <h1 className="text-3xl font-bold mb-6">Analytics & Insights</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-sm text-slate-500">Avg Resolution Time</span>
                    <div className="text-3xl font-bold text-slate-900 mt-2">2.4h</div>
                    <div className="text-xs text-green-600 font-bold mt-1">↓ 12% vs last week</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-sm text-slate-500">SLA Breach Rate</span>
                    <div className="text-3xl font-bold text-slate-900 mt-2">4.1%</div>
                    <div className="text-xs text-red-600 font-bold mt-1">↑ 1% vs last week</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-sm text-slate-500">Total Complaints</span>
                    <div className="text-3xl font-bold text-slate-900 mt-2">142</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-sm text-slate-500">Top Problem Area</span>
                    <div className="text-xl font-bold text-slate-900 mt-2">Block A - Water</div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border min-h-[400px] flex items-center justify-center text-slate-400">
                Chart Logic Placeholder (Recharts implementation pending)
            </div>
        </div>
    );
}
