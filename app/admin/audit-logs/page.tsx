"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, staggerContainer, slideUp } from "@/lib/animation/animations";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationFilters from "@/components/notifications/NotificationFilters";
import NotificationTable from "@/components/notifications/NotificationTable";
import NotificationDetailModal from "@/components/notifications/NotificationDetailModal";
import NotificationPagination from "@/components/notifications/NotificationPagination";
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

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, loading, error, meta, refetch } = useNotifications(filters);

  const delivered = data.filter((item) => item.status === "SENT").length;
  const failed = data.filter((item) => item.status === "FAILED").length;
  const pending = data.filter((item) => item.status === "PENDING").length;

  const setPage = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1600px] space-y-6 pb-10"
    >
      <motion.section
        variants={slideUp}
        className="overflow-hidden rounded-2xl border border-admin-border/80 bg-linear-to-br from-admin-card via-admin-card to-admin-primary/7 p-6 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.35)] sm:p-8 dark:to-admin-primary/12 dark:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.55)]"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-admin-primary/15 bg-admin-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-admin-primary sm:text-sm">
              <BellRing className="h-4 w-4" aria-hidden />
              Audit Logs
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-admin-fg sm:text-4xl">
                Notification Logs
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-admin-muted-foreground sm:text-[15px]">
                Track outbound email, WhatsApp, and SMS delivery with search, filters, pagination,
                and full provider response details.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={buttonHover}
            whileTap={buttonTap}
            onClick={() => refetch()}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-admin-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-admin-primary/25 transition-colors hover:bg-admin-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-card lg:w-auto"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Refresh logs
          </motion.button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BellRing} label="Loaded (page)" value={data.length} />
          <StatCard icon={CheckCircle2} label="Sent" value={delivered} tone="success" />
          <StatCard icon={TriangleAlert} label="Failed" value={failed} tone="danger" />
          <StatCard icon={Clock} label="Pending" value={pending} tone="warning" />
        </div>
      </motion.section>

      <NotificationFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <NotificationTable
        data={data}
        loading={loading}
        error={error}
        onView={(id: number) => setSelectedId(id)}
        onResetFilters={resetFilters}
      />

      {meta ? (
        <NotificationPagination
          meta={meta}
          loading={loading}
          page={filters.page}
          onPageChange={setPage}
        />
      ) : null}

      <NotificationDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "success" | "danger" | "warning" | "info";
}) {
  const toneClass = {
    default: "bg-admin-primary/10 text-admin-primary ring-admin-primary/15",
    success: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400",
    danger: "bg-red-500/10 text-red-600 ring-red-500/15 dark:text-red-400",
    warning: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
    info: "bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:text-sky-400",
  }[tone];

  return (
    <motion.div
      variants={slideUp}
      className="rounded-2xl border border-admin-border/80 bg-admin-card/90 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-admin-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-tight text-admin-fg sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </motion.div>
  );
}
