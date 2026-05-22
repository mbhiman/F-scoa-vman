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
    PanelLeftClose
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminAuthFetch, parseApiError } from "@/lib/admin-api";
import { useUIStore } from "@/store/ui-store";

type AdminProfile = {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
};

const ADMIN_TOKEN_KEY = "adminAccessToken";

function initialsFromName(name?: string) {
    const safe = (name ?? "").trim();
    if (!safe) return "AD";
    const parts = safe.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase() || "AD";
}

function clearAdminSession() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem("adminExpiresIn");
        localStorage.removeItem("adminExpiresAt");
    } catch {
        // ignore storage failures
    }
}

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
    "/admin/reports": "Reports",
    "/admin/analytics": "Analytics",
    "/admin/settings": "Settings",
};

export function AdminTopNav() {
    const { resolvedTheme, setTheme } = useTheme();
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    const [mounted, setMounted] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Timer reference for the "Forgiving Hover" delay
    const hoverTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Cleanup timers if the component unmounts
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current !== null) {
                window.clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
            setProfile(null);
            return;
        }

        const controller = new AbortController();

        const run = async () => {
            try {
                setProfileLoading(true);
                const res = await adminAuthFetch("/admin/me", { signal: controller.signal });
                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.success) {
                    const message = await parseApiError(res);
                    throw new Error(message || "Failed to fetch admin profile.");
                }

                setProfile(json.data as AdminProfile);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;

                clearAdminSession();
                setProfile(null);

                try {
                    window.location.assign("/signin/admin");
                } catch {
                    // ignore
                }
            } finally {
                setProfileLoading(false);
            }
        };

        void run();
        return () => controller.abort();
    }, []);

    const currentLabel =
        Object.entries(routeLabels).find(([key]) =>
            pathname.startsWith(key)
        )?.[1] ?? "Admin Panel";

    const displayName = profile?.name || "System Admin";
    const displayEmail = profile?.email || "—";
    const avatarText = initialsFromName(profile?.name);

    // --- Hover Logic Functions ---
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current !== null) {
            window.clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setUserOpen(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = window.setTimeout(() => {
            setUserOpen(false);
            hoverTimeoutRef.current = null;
        }, 250);
    };

    const handleSignOut = () => {
        setUserOpen(false);
        setNotifOpen(false);
        clearAdminSession();
        try {
            window.location.assign("/signin/admin");
        } catch {
            // ignore
        }
    };

    return (
        <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0 bg-admin-bg border-admin-border/50 sticky top-0 z-30">
            {/* Left Section */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile Hamburger / Desktop Collapse Sync */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 md:hidden text-admin-muted-foreground hover:text-admin-fg hover:bg-admin-muted/10 rounded-md transition-colors"
                >
                    {sidebarCollapsed ? <PanelLeftClose className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[15px] font-bold text-admin-fg truncate tracking-tight">
                        {currentLabel}
                    </span>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1.5 md:gap-2.5">
                {/* Search */}
                <button className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-lg text-sm border border-transparent hover:border-admin-border hover:bg-admin-muted/5 text-admin-muted-foreground hover:text-admin-fg transition-all">
                    <Search className="w-4.5 h-4.5 md:w-4 md:h-4" />
                    <span className="hidden md:inline font-medium">Quick Search...</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:border-admin-border text-admin-muted-foreground hover:bg-admin-muted/5 hover:text-admin-fg transition-all"
                >
                    {!mounted ? (
                        <div className="w-4.5 h-4.5" />
                    ) : resolvedTheme === "dark" ? (
                        <Sun className="w-4.5 h-4.5" />
                    ) : (
                        <Moon className="w-4.5 h-4.5" />
                    )}
                </button>

                {/* Notifications */}
                <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:border-admin-border text-admin-muted-foreground hover:bg-admin-muted/5 hover:text-admin-fg transition-all"
                >
                    <Bell className="w-4.5 h-4.5" />
                </button>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-admin-border/60 mx-1 hidden md:block"></div>

                {/* Professional User Dropdown with Forgiving Hover */}
                <div
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* The Button acts as both a hover target (desktop) and click target (mobile) */}
                    <button
                        onClick={() => setUserOpen(!userOpen)}
                        className={`flex items-center gap-2.5 p-1 md:pl-2 md:pr-3 md:py-1.5 rounded-lg border transition-all focus:outline-none ${userOpen ? 'bg-admin-primary/5 border-admin-primary/20' : 'border-transparent hover:bg-admin-muted/5 hover:border-admin-border'}`}
                    >
                        <div className="w-8 h-8 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[11px] md:text-xs font-bold text-white bg-admin-primary shadow-sm ring-2 ring-admin-bg">
                            {avatarText}
                        </div>

                        <div className="hidden lg:flex flex-col items-start justify-center">
                            <span className="text-[13px] font-bold text-admin-fg leading-none">
                                {profileLoading ? "Loading…" : displayName}
                            </span>
                        </div>

                        <ChevronDown className={`hidden sm:inline w-3.5 h-3.5 text-admin-muted-foreground transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Popover Implementation */}
                    {userOpen && (
                        <>
                            {/* Invisible overlay captures clicks anywhere else on the screen to close the menu. Hidden on MD so it doesn't block desktop hover interactions. */}
                            <div className="fixed inset-0 z-40 md:hidden" onClick={() => setUserOpen(false)} />

                            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border shadow-xl z-50 py-1.5 bg-admin-card border-admin-border animate-in fade-in slide-in-from-top-2 duration-200">

                                <div className="px-4 py-3 border-b border-admin-border/50">
                                    <p className="text-sm font-bold text-admin-fg truncate">
                                        {profileLoading ? "Loading…" : displayName}
                                    </p>
                                    <p className="text-[11px] font-medium text-admin-muted-foreground truncate mt-0.5">
                                        {displayEmail}
                                    </p>
                                </div>

                                <div className="py-1.5">
                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setUserOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-admin-fg hover:bg-admin-muted/10 transition-colors"
                                    >
                                        <User className="w-4 h-4 text-admin-muted-foreground" />
                                        My Profile
                                    </Link>

                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setUserOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-admin-fg hover:bg-admin-muted/10 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-admin-muted-foreground" />
                                        Account Settings
                                    </Link>
                                </div>

                                <div className="border-t border-admin-border/50 mt-1 pt-1.5 pb-0.5">
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        className="flex w-full items-center gap-3 px-4 py-2 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out Safely
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}