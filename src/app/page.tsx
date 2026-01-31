'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('STUDENT'); // For Signup
  const [message, setMessage] = useState('');

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'STAFF') router.push('/staff');
      else router.push('/student');
    }
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, full_name: email.split('@')[0] } // Trigger wants role here
          }
        });
        if (error) throw error;
        setMessage('Account created! Please check your email to verify.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // useEffect will handle redirect once 'user' state updates from AuthContext
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage(error.message);
      setLoading(false);
    } finally {
      // Keep loading true on success to prevent UI flicker before redirect
      if (message) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Column: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold tracking-tight">HostelFix Enterprise</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Intelligent Maintenance <br />
            <span className="text-blue-500">Management System.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Streamline your hostel operations with our event-driven architecture.
            Automated prioritization, real-time SLAs, and clear accountability.
          </p>
        </div>
        <div className="relative z-10 text-sm text-slate-500">
          © 2026 HostelCorp Inc. All rights reserved. v2.0 Enterprise
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isSignUp ? 'Register to access the portal' : 'Sign in to your account'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Enter your credentials to access the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-9 rounded-md border border-slate-200 px-3 py-1 text-sm bg-white text-slate-900"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full h-9 rounded-md border border-slate-200 px-3 py-1 text-sm bg-white text-slate-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      className="w-full h-9 rounded-md border border-slate-200 px-3 py-1 text-sm bg-white text-slate-900"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="STAFF">Maintenance Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                )}

                {message && (
                  <div className={`text-xs p-2 rounded ${message.includes('created') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
