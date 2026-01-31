'use client';

import { useAuth, UserRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
    children,
    allowedRoles
}: {
    children: React.ReactNode;
    allowedRoles: UserRole[]
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/');
            } else if (!allowedRoles.includes(user.role)) {
                // Redirect to their home? or access denied
                alert('Access Denied');
                router.push('/');
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user || !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
