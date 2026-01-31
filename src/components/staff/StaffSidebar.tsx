'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Home,
    ClipboardList,
    LogOut,
    Wrench
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function StaffSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: '/staff', label: 'Overview', icon: Home },
        { href: '/staff/tasks', label: 'My Tasks', icon: ClipboardList },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-50 flex flex-col fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-orange-500" />
                    Field Staff
                </h2>
                <p className="text-xs text-slate-400 mt-1">Maintenance Portal</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-orange-600 text-white shadow-md"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800 gap-2"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
