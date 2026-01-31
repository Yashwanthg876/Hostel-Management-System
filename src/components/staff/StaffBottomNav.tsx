'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, ClipboardList, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function StaffBottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: '/staff', label: 'Home', icon: Home },
        { href: '/staff/tasks', label: 'Tasks', icon: ClipboardList },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 md:hidden pb-safe">
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isActive && "fill-current/10")} />
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </Link>
                );
            })}

            <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-500"
            >
                <LogOut className="h-6 w-6" />
                <span className="text-[10px] font-medium">Exit</span>
            </button>
        </div>
    );
}
