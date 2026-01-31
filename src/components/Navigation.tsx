'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Navigation() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (pathname === '/') return null; // Don't show nav on login page

    return (
        <nav className="border-b bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/staff' : '/student'} className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HostelFix
            </Link>

            <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
                {user?.role === 'STUDENT' && <Link href="/student" className="hover:text-blue-600 transition-colors">Raise Complaint</Link>}

                {user?.role === 'ADMIN' && (
                    <>
                        <Link href="/admin" className="hover:text-blue-600 transition-colors">Queue</Link>
                        <Link href="/analytics" className="hover:text-blue-600 transition-colors">Analytics</Link>
                    </>
                )}

                {user?.role === 'STAFF' && <Link href="/staff" className="hover:text-blue-600 transition-colors">My Tasks</Link>}

                {user && (
                    <div className="flex items-center gap-4 pl-4 border-l">
                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {user.name} ({user.role})
                        </span>
                        <button
                            onClick={logout}
                            className="text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
