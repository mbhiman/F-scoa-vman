"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogIn, Menu, UserPlus, X, Home } from "lucide-react";

import  ThemeToggle  from "@/components/common/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/signup", label: "Sign up", icon: <UserPlus className="h-4 w-4" /> },
  { href: "/signin", label: "Sign in", icon: <LogIn className="h-4 w-4" /> },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicNavbar() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Home"
        >
          <Image
            src="/images/f-scoa-logo.png"
            alt="f-scoa-logo"
            width={120}
            height={40}
            priority
            className="h-8 w-auto sm:h-9 md:h-10 object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  "transition-colors",
                  active
                    ? "bg-primary text-foreground"
                    : "text-muted hover:bg-secondary/15 hover:text-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                ].join(" ")}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="font-ui">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className={[
              "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border",
              "bg-background/60 text-foreground shadow-sm shadow-black/5",
              "transition-colors hover:border-border-hover hover:bg-background",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "md:hidden",
            ].join(" ")}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="public-mobile-menu"
        className={[
          "md:hidden",
          "overflow-hidden border-t border-border bg-background/90 backdrop-blur",
          mobileOpen ? "max-h-96" : "max-h-0",
          "transition-[max-height] duration-200 ease-out",
        ].join(" ")}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label="Mobile primary">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm",
                  "transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-secondary/15",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={active ? "text-white" : "text-muted"} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="font-ui">{item.label}</span>
                </span>
                <span
                  className={[
                    "text-xs",
                    active ? "text-white/90" : "text-muted",
                    "font-medium",
                  ].join(" ")}
                  style={{ fontFamily: "var(--font-mono)" }}
                  aria-hidden="true"
                >
                  {item.href}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}