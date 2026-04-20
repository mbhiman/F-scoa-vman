"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  HelpCircle,
  ClipboardList,
  Award,
  BarChart3,
  Shield,
  Key,
  ScrollText,
  Settings,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/admin/learners", label: "Learners", icon: Users },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/questions", label: "Questions", icon: HelpCircle },
      { href: "/admin/assessments", label: "Assessments", icon: ClipboardList },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/admins", label: "Admins", icon: Shield },
      // { href: "/admin/roles", label: "Roles & Perms", icon: Key },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`relative flex flex-col h-full border-r transition-all duration-300
      ${sidebarCollapsed ? "w-15" : "w-60"}
      bg-admin-bg border-admin-border`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-admin-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-admin-primary text-white">
          <GraduationCap className="w-4 h-4" />
        </div>

        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-admin-foreground truncate">
              SCOA Admin
            </p>
            <p className="text-xs text-admin-muted-foreground">
              Flipkart Academy
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((group) => (
          <div key={group.title} className="mb-6">
            {!sidebarCollapsed && (
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-admin-muted-foreground">
                {group.title}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all
                      ${sidebarCollapsed ? "justify-center" : ""}
                      ${isActive
                          ? "bg-admin-primary text-white"
                          : "text-admin-foreground hover:bg-admin-primary/10"
                        }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-3 border-t border-admin-border">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition
          text-admin-muted-foreground hover:bg-admin-primary/10
          ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""
              }`}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}