'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Lock } from 'lucide-react';

// Replacing Switch/Label with standard HTML for now to avoid dependency errors if components missing
export default function SettingsPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Settings className="h-8 w-8 text-slate-600" />
                    System Configuration
                </h1>
                <p className="text-slate-500">Manage global settings, notifications, and security rules.</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-500" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Configure how and when alerts are sent to staff.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-slate-900">Email Alerts</span>
                                <p className="text-xs text-slate-500">Receive emails for high severity tickets.</p>
                            </div>
                            {/* Mock Switch */}
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-slate-900">SLA Breach Warnings</span>
                                <p className="text-xs text-slate-500">Notify admins 1 hour before breach.</p>
                            </div>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-500" />
                            <CardTitle>Security & Access</CardTitle>
                        </div>
                        <CardDescription>Manage role-based access control.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-slate-900">Allow Student Signups</span>
                                <p className="text-xs text-slate-500">If disabled, only admins can create accounts.</p>
                            </div>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <div className="pt-4">
                            <Button variant="outline" className="w-full sm:w-auto">
                                Manage Roles in Supabase ↗
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-red-500" />
                            <CardTitle className="text-red-700">Danger Zone</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="destructive">
                            Purge All Resolved Tickets
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
