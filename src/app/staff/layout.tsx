import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // STAFF can access, and ADMIN can also view if they want to debug/check
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden md:block">
                    <StaffSidebar />
                </div>

                {/* Mobile Bottom Nav - Hidden on Desktop */}
                <StaffBottomNav />

                {/* Main Content - Adjust margin for desktop sidebar */}
                <main className="md:ml-64 min-h-screen transition-all duration-200">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
