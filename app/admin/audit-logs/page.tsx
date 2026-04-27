"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { BellRing, CheckCircle2, Clock, RefreshCcw, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, staggerContainer, slideUp } from "@/lib/animation/animations";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationFilters from "@/components/notifications/NotificationFilters";
import NotificationTable from "@/components/notifications/NotificationTable";
import NotificationDetailModal from "@/components/notifications/NotificationDetailModal";
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

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.section
        variants={slideUp}
        className="overflow-hidden rounded-2xl border border-admin-border bg-linear-to-br from-admin-card via-admin-card to-admin-primary/10 p-6 shadow-admin-card"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-admin-primary/10 px-3 py-1 text-sm font-medium text-admin-primary">
              <BellRing className="h-4 w-4" />
              Audit Logs
            </div>
            <h1 className="mt-4 text-3xl font-bold text-admin-fg">Notification Logs</h1>
            <p className="mt-2 text-sm leading-6 text-admin-muted-foreground">
              Track outbound email, WhatsApp, and SMS delivery audit logs with search, filters,
              pagination, and full provider response details.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={buttonHover}
            whileTap={buttonTap}
            onClick={() => refetch()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-admin-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-admin-primary-hover"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Logs
          </motion.button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BellRing} label="Loaded logs" value={data.length} />
          <StatCard icon={CheckCircle2} label="Sent" value={delivered} tone="success" />
          <StatCard icon={TriangleAlert} label="Failed" value={failed} tone="danger" />
          <StatCard icon={Clock} label="Pending" value={pending} tone="warning" />
        </div>
      </motion.section>

      <NotificationFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <NotificationTable
        data={data}
        loading={loading}
        error={error}
        onView={(id: number) => setSelectedId(id)}
      />

      {meta ? (
        <motion.div
          variants={slideUp}
          className="admin-card flex flex-col gap-3 p-4 text-sm text-admin-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            Showing page <span className="font-semibold text-admin-fg">{meta.page}</span> of{" "}
            <span className="font-semibold text-admin-fg">{meta.totalPages || 1}</span> for{" "}
            <span className="font-semibold text-admin-fg">{meta.total}</span> logs
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={buttonHover}
              whileTap={buttonTap}
              disabled={!meta.hasPrev || loading}
              onClick={() => setPage(Math.max(1, filters.page - 1))}
              className="rounded-xl border border-admin-border px-4 py-2 font-medium text-admin-fg transition-colors hover:border-admin-primary hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </motion.button>
            <motion.button
              type="button"
              whileHover={buttonHover}
              whileTap={buttonTap}
              disabled={!meta.hasNext || loading}
              onClick={() => setPage(filters.page + 1)}
              className="rounded-xl border border-admin-border px-4 py-2 font-medium text-admin-fg transition-colors hover:border-admin-primary hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      ) : null}

      <NotificationDetailModal
        id={selectedId}
        onClose={() => setSelectedId(null)}
      />
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
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneClass = {
    default: "bg-admin-primary/10 text-admin-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    danger: "bg-red-500/10 text-red-500",
    warning: "bg-amber-500/10 text-amber-500",
  }[tone];

  return (
    <motion.div variants={slideUp} className="rounded-2xl border border-admin-border bg-admin-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-admin-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-admin-fg">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}