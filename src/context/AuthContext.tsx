'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'STUDENT' | 'ADMIN' | 'STAFF';

interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await fetchProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const fetchProfile = async (authUser: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
        try {
            console.log("Fetching profile for:", authUser.id);

            // USE maybeSingle() TO AVOID ERRORS ON MISSING DATA
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) {
                console.error("Profile fetch error details:", JSON.stringify(error, null, 2));
                // Attempt to continue anyway (Self-Healing attempt for RLS edge cases)
                // If the error is 'PGRST116' (Data not found) or '406' (Not Acceptable), we might want to proceed to create.
                // But for now, let's just Log and Fallback to creation check.
                if (error.code === 'PGRST116') {
                    // Proceed to creation logic below
                } else {
                    return;
                }
            }

            // Logic A: Profile Exists
            if (profile) {
                console.log("Profile found:", profile);
                setUser({
                    id: profile.id,
                    email: profile.email,
                    role: profile.role as UserRole,
                    name: profile.full_name || profile.email
                });
                return;
            }

            // Logic B: Profile Missing (result was null, but no error)
            // Auto-create profile logic
            console.warn("Profile missing (null). Attempting to create default profile...");
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || 'User',
                    role: 'STUDENT'
                })
                .select()
                .single();

            if (createError) {
                console.error("Failed to create missing profile:", createError);
                return;
            }

            if (newProfile) {
                console.log("Created missing profile:", newProfile);
                setUser({
                    id: newProfile.id,
                    email: newProfile.email,
                    role: newProfile.role as UserRole,
                    name: newProfile.full_name || newProfile.email
                });
            }

        } catch (error) {
            console.error("Critical Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = (role: UserRole) => {
        console.warn("Using deprecated mock login");
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
