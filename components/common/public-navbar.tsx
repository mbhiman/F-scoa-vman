"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, LogIn, Menu, UserPlus, X } from "lucide-react";

import ThemeToggle from "@/components/common/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Platform overview",
    icon: <Home className="h-4 w-4" />,
  },
  {
    href: "/signup/regular",
    label: "Regular Learners",
    description: "Standard learner flow",
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    href: "/signup/ncvet",
    label: "NCVET Learners",
    description: "NCVET learner access",
    icon: <LogIn className="h-4 w-4" />,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  // REGULAR GROUP
  if (href.includes("regular")) {
    return pathname.includes("/regular");
  }

  // NCVET GROUP
  if (href.includes("ncvet")) {
    return pathname.includes("/ncvet");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicNavbar() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Go to homepage"
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

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
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
            aria-controls="public-mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="public-mobile-menu"
        className={[
          "overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden",
          mobileOpen ? "max-h-128" : "max-h-0",
          "transition-[max-height] duration-300 ease-out",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 sm:hidden">
            <div>
              <p className="text-sm font-medium text-foreground">Navigation</p>
              <p className="text-xs text-muted">Choose your learning path</p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="flex flex-col gap-2" aria-label="Mobile primary navigation">
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
                        active
                          ? "border-white/20 text-white/90"
                          : "border-border text-muted",
                      ].join(" ")}
                    >
                      Open
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}