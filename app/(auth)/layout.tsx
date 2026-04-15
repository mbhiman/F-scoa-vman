import type { ReactNode } from "react";
import PublicNavbar from "@/components/common/public-navbar";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* Navbar */}
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer (optional) */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted">
        © {new Date().getFullYear()} SCOA. All rights reserved.
      </footer>

    </div>
  );
}