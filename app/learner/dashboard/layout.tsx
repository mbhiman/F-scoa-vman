import type { ReactNode } from "react";
import LearnerNavbar from "@/components/learner/learner-navbar";
import LearnerFooter from "@/components/learner/learner-footer";

export default function LearnerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LearnerNavbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <LearnerFooter />
    </div>
  );
}

