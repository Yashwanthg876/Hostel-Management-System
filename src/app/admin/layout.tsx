import { AdminSidebar } from '@/components/admin/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // We wrap the entire layout in ProtectedRoute to ensure ONLY admins can access any generic /admin/* page
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-slate-50">
                <AdminSidebar />
                <main className="ml-64 min-h-screen">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
