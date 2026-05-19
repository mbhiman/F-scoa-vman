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
  ScrollText,
  Settings,
  GraduationCap,
  PanelLeftClose,
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
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile Backdrop Overlay - Decoupled CSS Logic */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200 md:hidden ${sidebarCollapsed ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          }`}
        onClick={toggleSidebar}
      />

      <aside
        className={`fixed md:relative z-50 flex flex-col h-full border-r transition-all duration-300 ease-in-out bg-admin-card border-admin-border shadow-2xl md:shadow-none
                ${sidebarCollapsed ? "translate-x-0 w-64 md:w-16" : "-translate-x-full md:translate-x-0 w-64 md:w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-admin-border/50 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-admin-primary text-white shadow-sm shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>

          <div className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 ${sidebarCollapsed ? 'block md:hidden' : 'hidden md:block'}`}>
            <p className="text-sm font-bold text-admin-foreground truncate">
              SCOA Admin
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-admin-muted-foreground truncate">
              Flipkart Academy
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
          {navItems.map((group) => (
            <div key={group.title} className="mb-6">
              <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-admin-muted-foreground/70 ${sidebarCollapsed ? 'block md:hidden' : 'hidden md:block'}`}>
                {group.title}
              </p>

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          // Only auto-close if on a mobile device width
                          if (window.innerWidth < 768) toggleSidebar();
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group
                                                ${sidebarCollapsed ? "md:justify-center" : ""}
                                                ${isActive
                            ? "bg-admin-primary/10 text-admin-primary"
                            : "text-admin-muted-foreground hover:bg-admin-muted/10 hover:text-admin-fg"
                          }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? "text-admin-primary" : "text-admin-muted-foreground group-hover:text-admin-fg"}`} />
                        <span className={`truncate ${sidebarCollapsed ? 'block md:hidden' : 'hidden md:block'}`}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Toggle - Hidden entirely on Mobile, handles Desktop collapse */}
        <div className="hidden md:block p-3 border-t border-admin-border/50">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        text-admin-muted-foreground hover:bg-admin-muted/10 hover:text-admin-fg
                        ${sidebarCollapsed ? "justify-center" : ""}`}
            title="Toggle Sidebar"
          >
            <PanelLeftClose
              className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}
            />
            <span className={`truncate ${sidebarCollapsed ? 'hidden' : 'block'}`}>Collapse Menu</span>
          </button>
        </div>
      </aside>
    </>
  );
}