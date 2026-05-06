"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Home, LogOut, Menu, Settings, User, X } from "lucide-react";

import ThemeToggle from "@/components/common/theme-toggle";
import { LearnerAuth } from "@/lib/learner-auth";
import { useStudentAuthStore } from "@/store/student-auth-store";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/learner/dashboard",
    label: "Dashboard",
    description: "Overview and profile",
    icon: <Home className="h-4 w-4" />,
  },
  {
    href: "/learner/quiz",
    label: "quiz",
    description: "Your learning journey",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: "/learner/profile",
    label: "Profile",
    description: "Account & settings",
    icon: <User className="h-4 w-4" />,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type StudentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
};

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

function initialsFromName(firstName?: string, lastName?: string) {
  const first = (firstName ?? "").trim().slice(0, 1);
  const last = (lastName ?? "").trim().slice(0, 1);
  const initials = `${first}${last}`.trim().toUpperCase();
  return initials || "ST";
}

async function safeReadJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function LearnerNavbar() {
  const pathname = usePathname() ?? "/learner/dashboard";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const logout = useStudentAuthStore((s) => s.logout);

  const [userOpen, setUserOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const userMenuCloseTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const cancelUserMenuClose = React.useCallback(() => {
    if (userMenuCloseTimerRef.current === null) return;
    window.clearTimeout(userMenuCloseTimerRef.current);
    userMenuCloseTimerRef.current = null;
  }, []);

  const scheduleUserMenuClose = React.useCallback(
    (delayMs: number) => {
      cancelUserMenuClose();
      userMenuCloseTimerRef.current = window.setTimeout(() => {
        setUserOpen(false);
        userMenuCloseTimerRef.current = null;
      }, delayMs);
    },
    [cancelUserMenuClose],
  );

  React.useEffect(() => {
    return () => cancelUserMenuClose();
  }, [cancelUserMenuClose]);

  const handleLogout = async () => {
    cancelUserMenuClose();
    setUserOpen(false);
    await logout();
    router.push("/signin/regular");
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = LearnerAuth.getToken();
    if (!token) {
      setProfile(null);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        setProfileLoading(true);

        if (!BASE_URL) {
          throw new Error("Backend URL is not configured.");
        }

        const headers = new Headers();
        headers.set("Authorization", `Bearer ${token}`);

        const res = await fetch(`${BASE_URL}/student/me`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        const json = await safeReadJson(res);

        if (!res.ok || !json || typeof json !== "object" || !(json as { success?: unknown })?.success) {
          throw new Error("Failed to fetch student profile.");
        }

        const data = (json as { data?: unknown }).data as Partial<StudentProfile> | undefined;

        if (!data?.id) throw new Error("Failed to fetch student profile.");

        setProfile({
          id: String(data.id),
          firstName: String(data.firstName ?? ""),
          lastName: String(data.lastName ?? ""),
          mobile: String(data.mobile ?? ""),
          email: String(data.email ?? ""),
          isVerified: Boolean(data.isVerified),
          isActive: Boolean(data.isActive),
          lastLoginAt: typeof data.lastLoginAt === "string" ? data.lastLoginAt : null,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setProfile(null);
        await handleLogout();
      } finally {
        setProfileLoading(false);
      }
    };

    void run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || "Student"
    : "Student";
  const displayEmail = profile?.email?.trim() || "—";
  const avatarText = initialsFromName(profile?.firstName, profile?.lastName);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/learner/dashboard"
          className="group inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Go to learner dashboard"
        >
          <div className="flex items-center justify-center rounded-xl bg-background px-3 py-2 transition-colors">
            <Image
              src="/images/f-scoa-logo.png"
              alt="Flipkart SCOA"
              width={132}
              height={40}
              priority
              className="h-8 w-auto object-contain sm:h-9"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Learner navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-transparent bg-background text-muted hover:border-border hover:bg-background hover:text-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "transition-colors",
                    active ? "text-white" : "text-muted group-hover:text-foreground",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="font-ui">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <div
            className="relative ml-1 hidden md:block"
            onMouseEnter={() => {
              cancelUserMenuClose();
              setUserOpen(true);
            }}
            onMouseLeave={() => scheduleUserMenuClose(1000)}
          >
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className={[
                "flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 transition-colors",
                "hover:border-border-hover hover:bg-background",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              ].join(" ")}
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {avatarText}
              </div>

              <span className="hidden lg:inline text-sm font-medium text-foreground">
                {profileLoading ? "Loading…" : displayName}
              </span>

              <ChevronDown className="hidden sm:inline h-4 w-4 text-muted" aria-hidden="true" />
            </button>

            {userOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {profileLoading ? "Loading…" : displayName}
                  </p>
                  <p className="text-xs text-muted">{displayEmail}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/learner/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40"
                    role="menuitem"
                  >
                    <User className="h-4 w-4 text-muted" aria-hidden="true" />
                    Profile
                  </Link>

                  <Link
                    href="/learner/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
                    Settings
                  </Link>
                </div>

                <div className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-600/10"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={[
              "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border",
              "bg-background text-foreground shadow-sm transition-colors",
              "hover:border-border-hover hover:bg-background",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "md:hidden",
            ].join(" ")}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="learner-mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="learner-mobile-menu"
        className={[
          "overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden",
          mobileOpen ? "max-h-128" : "max-h-0",
          "transition-[max-height] duration-300 ease-out",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 sm:hidden">
            <div>
              <p className="text-sm font-medium text-foreground">Learner menu</p>
              <p className="text-xs text-muted">Navigate your account</p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="flex flex-col gap-2" aria-label="Mobile learner navigation">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-2xl border px-4 py-3 transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-foreground hover:border-border-hover",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={[
                          "mt-0.5 transition-colors",
                          active ? "text-white" : "text-muted",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>

                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span
                          className={[
                            "mt-0.5 text-xs",
                            active ? "text-white/80" : "text-muted",
                          ].join(" ")}
                        >
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
                        active ? "border-white/20 text-white/90" : "border-border text-muted",
                      ].join(" ")}
                    >
                      Open
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className={[
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors",
              "hover:border-border-hover",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            ].join(" ")}
          >
            <LogOut className="h-4 w-4 text-muted" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

