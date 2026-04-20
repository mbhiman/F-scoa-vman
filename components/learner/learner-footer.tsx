"use client";

import Link from "next/link";

export default function LearnerFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} SCOA. All rights reserved.</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/privacy-policy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-foreground hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

