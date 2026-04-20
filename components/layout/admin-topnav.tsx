"use client";

import {
    Bell,
    Search,
    Moon,
    Sun,
    ChevronDown,
    LogOut,
    User,
    Settings,
    Menu,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const routeLabels: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/learners": "Learners",
    "/admin/courses": "Courses",
    "/admin/questions": "Questions",
    "/admin/assessments": "Assessments",
    "/admin/certificates": "Certificates",
    "/admin/admins": "Admins",
    "/admin/roles": "Roles & Permissions",
    "/admin/audit-logs": "Audit Logs",
    "/admin/analytics": "Analytics",
    "/admin/settings": "Settings",
};

export function AdminTopNav() {
    const { resolvedTheme, setTheme } = useTheme();
    const pathname = usePathname();

    const [mounted, setMounted] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentLabel =
        Object.entries(routeLabels).find(([key]) =>
            pathname.startsWith(key)
        )?.[1] ?? "Admin";

    return (
        <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0 bg-admin-bg border-admin-border">
            {/* Left */}
            <div className="flex items-center gap-2 md:gap-4">
                <button className="p-2 -ml-2 md:hidden text-admin-muted-foreground hover:text-admin-primary">
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="hidden sm:inline text-sm text-admin-muted-foreground">
                        Admin
                    </span>
                    <span className="hidden sm:inline text-admin-muted-foreground">/</span>
                    <span className="text-sm font-semibold text-admin-foreground truncate">
                        {currentLabel}
                    </span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 md:gap-2">
                {/* Search */}
                <button className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-md text-sm border border-transparent md:border-admin-border text-admin-muted-foreground hover:bg-admin-primary/10 transition-colors">
                    <Search className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    <span className="hidden md:inline">Search...</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() =>
                        setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent md:border-admin-border text-admin-muted-foreground hover:bg-admin-primary/10 transition-colors"
                >
                    {!mounted ? (
                        <div className="w-4 h-4" />
                    ) : resolvedTheme === "dark" ? (
                        <Sun className="w-4 h-4" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                </button>

                {/* Notifications */}
                <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent md:border-admin-border text-admin-muted-foreground hover:bg-admin-primary/10 transition-colors"
                >
                    <Bell className="w-4 h-4" />
                </button>

                {/* User */}
                <div className="relative ml-1">
                    <button
                        onClick={() => setUserOpen(!userOpen)}
                        className="flex items-center gap-2 p-1 md:pl-2 md:pr-3 md:py-1.5 rounded-md border border-transparent md:border-admin-border hover:bg-admin-primary/10 transition-colors"
                    >
                        <div className="w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white bg-admin-primary">
                            SA
                        </div>

                        <span className="hidden lg:inline text-sm font-medium text-admin-foreground">
                            Super Admin
                        </span>

                        <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-admin-muted-foreground" />
                    </button>

                    {userOpen && (
                        <div className="absolute right-0 top-12 w-56 rounded-xl border shadow-xl z-50 py-1 bg-admin-bg border-admin-border">
                            <div className="px-4 py-3 border-b border-admin-border">
                                <p className="text-sm font-medium text-admin-foreground">
                                    Super Admin
                                </p>
                                <p className="text-xs text-admin-muted-foreground">
                                    admin@scoa.com
                                </p>
                            </div>

                            <div className="py-1">
                                <Link
                                    href="/admin/settings"
                                    onClick={() => setUserOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-admin-foreground hover:bg-admin-primary/10"
                                >
                                    <User className="w-4 h-4 text-admin-muted-foreground" />
                                    Profile
                                </Link>

                                <Link
                                    href="/admin/settings"
                                    onClick={() => setUserOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-admin-foreground hover:bg-admin-primary/10"
                                >
                                    <Settings className="w-4 h-4 text-admin-muted-foreground" />
                                    Settings
                                </Link>
                            </div>

                            <div className="border-t mt-1 pt-1 border-admin-border">
                                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10">
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
