"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Activity, BellRing, BookOpen, RefreshCcw } from "lucide-react";
import { fadeIn, slideUp } from "@/lib/animation/animations";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationFilters from "@/components/notifications/NotificationFilters";
import NotificationTable from "@/components/notifications/NotificationTable";
import NotificationPagination from "@/components/notifications/NotificationPagination";
import NotificationDetailModal from "@/components/notifications/NotificationDetailModal";
import { AdminCourseLogsList } from "@/components/admin/courseaudit/AdminCourseLogsList";
import { AdminCourseLogDetailModal } from "@/components/admin/courseaudit/AdminCourseLogDetailModal";
import type { NotificationFilters as NotificationFilterState } from "@/hooks/useNotifications";

const DEFAULT_FILTERS: NotificationFilterState = {
  page: 1,
  limit: 50,
  channel: "",
  status: "",
  template: "",
  search: "",
  from: "",
  to: "",
};

type LogTab = "notifications" | "courses" | "activity";

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<LogTab>("notifications");
  const [filters, setFilters] = useState<NotificationFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCourseLogId, setSelectedCourseLogId] = useState<number | null>(null);

  const { data, loading, error, meta, refetch } = useNotifications(filters);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mx-auto mt-4 max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-admin-primary">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-admin-fg sm:text-3xl">
            Audit Logs
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-admin-muted-foreground">
            Monitor notifications, course modifications, and system activity. Course audit
            records are read-only.
          </p>
        </div>

        {activeTab === "notifications" && (
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-sm font-semibold text-admin-fg shadow-sm transition-all hover:border-admin-primary/40 hover:bg-admin-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh notifications
          </button>
        )}
      </header>

      <nav
        className="border-b border-admin-border/70"
        aria-label="Audit log categories"
      >
        <div className="-mb-px flex gap-1 overflow-x-auto custom-scrollbar sm:gap-2">
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={BellRing}
            label="Notifications"
          />
          <TabButton
            active={activeTab === "courses"}
            onClick={() => setActiveTab("courses")}
            icon={BookOpen}
            label="Course Changes"
          />
          <TabButton
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
            icon={Activity}
            label="System Activity"
          />
        </div>
      </nav>

      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        variants={slideUp}
        className="pt-1"
      >
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <NotificationFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
            <NotificationTable
              data={data}
              loading={loading}
              error={error}
              onView={setSelectedId}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            />
            {meta && (
              <NotificationPagination
                meta={meta}
                loading={loading}
                page={filters.page}
                onPageChange={(p) => setFilters((c) => ({ ...c, page: p }))}
              />
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <AdminCourseLogsList onViewLog={setSelectedCourseLogId} />
        )}

        {activeTab === "activity" && <SystemActivityPlaceholder />}
      </motion.div>

      <NotificationDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      <AdminCourseLogDetailModal
        logId={selectedCourseLogId}
        onClose={() => setSelectedCourseLogId(null)}
      />
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25 ${
        active
          ? "border-b-2 border-admin-primary bg-admin-primary/5 text-admin-primary"
          : "border-b-2 border-transparent text-admin-muted-foreground hover:border-admin-border hover:bg-admin-muted/5 hover:text-admin-fg"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function SystemActivityPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border/70 bg-admin-card/40 px-6 py-20 text-center">
      <Activity className="mb-3 h-9 w-9 text-admin-muted-foreground/50" aria-hidden />
      <h3 className="text-sm font-semibold text-admin-fg">System security activity</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-admin-muted-foreground">
        Admin logins, role changes, and settings modifications will appear here when the
        backend endpoint is available.
      </p>
    </div>
  );
}
