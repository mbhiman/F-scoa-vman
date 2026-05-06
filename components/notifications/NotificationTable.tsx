"use client";

import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animation/animations";
import type { Notification } from "@/hooks/useNotifications";
import NotificationRow from "./NotificationRow";
import NotificationMobileCard from "./NotificationMobileCard";

function ShimmerBar({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-admin-primary/[0.07] ${className}`}>
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-admin-card/90 to-transparent dark:via-white/10"
        initial={{ x: "-120%" }}
        animate={{ x: "120%" }}
        transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="admin-card overflow-hidden border-admin-border/80 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.18)] dark:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.5)]">
      <div className="space-y-4 p-4 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-admin-border/70 bg-admin-card/60 p-4 backdrop-blur-sm"
          >
            <div className="flex gap-3">
              <ShimmerBar className="h-12 w-12 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmerBar className="h-4 w-[85%] max-w-[220px]" />
                <ShimmerBar className="h-3 w-full max-w-[180px]" />
                <ShimmerBar className="h-3 w-[62%] max-w-[140px]" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ShimmerBar className="h-14 w-full rounded-xl" />
              <ShimmerBar className="h-14 w-full rounded-xl" />
            </div>
            <div className="mt-3 flex justify-end">
              <ShimmerBar className="h-11 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="border-b border-admin-border/80 bg-admin-bg/40 px-4 py-3 dark:bg-admin-bg/20">
          <ShimmerBar className="h-4 w-full max-w-md rounded-md" />
        </div>
        <div className="divide-y divide-admin-border/80">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-4">
              <ShimmerBar className="h-10 w-36 shrink-0 rounded-xl" />
              <ShimmerBar className="h-8 w-24 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmerBar className="h-4 w-[42%] max-w-[200px]" />
                <ShimmerBar className="h-3 w-[58%] max-w-[280px]" />
              </div>
              <ShimmerBar className="hidden h-8 w-20 shrink-0 rounded-full lg:block" />
              <ShimmerBar className="h-4 w-36 shrink-0" />
              <ShimmerBar className="h-9 w-24 shrink-0 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotificationTable({
  data,
  loading,
  error,
  onView,
  onResetFilters,
}: {
  data: Notification[];
  loading: boolean;
  error?: string;
  onView: (id: number) => void;
  onResetFilters?: () => void;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="admin-card flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-4 border-admin-border/80 p-8 text-center sm:p-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] bg-red-500/15 blur-xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-9 w-9" aria-hidden />
          </div>
        </div>
        <div className="max-w-md">
          <h3 className="font-heading text-lg font-semibold text-admin-fg sm:text-xl">
            Unable to load notification logs
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-admin-muted-foreground">{error}</p>
        </div>
        {onResetFilters ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResetFilters}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-5 py-2.5 text-sm font-semibold text-admin-fg shadow-sm transition-colors hover:border-admin-primary/35 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset filters
          </motion.button>
        ) : null}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="admin-card flex min-h-[min(440px,72vh)] flex-col items-center justify-center gap-6 border-admin-border/80 p-8 text-center sm:p-12">
        <div className="relative">
          <div
            className="absolute -inset-6 rounded-full bg-admin-primary/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-4xl border border-admin-primary/20 bg-linear-to-br from-admin-primary/20 via-admin-primary/10 to-transparent shadow-inner ring-1 ring-admin-primary/15">
            <Inbox className="h-12 w-12 text-admin-primary" aria-hidden />
          </div>
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="font-heading text-lg font-semibold text-admin-fg sm:text-xl">
            No notification logs match your filters
          </h3>
          <p className="text-sm leading-relaxed text-admin-muted-foreground">
            Try widening the date range, clearing search, or choosing &quot;All&quot; for channel
            and status to see more results.
          </p>
        </div>
        {onResetFilters ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResetFilters}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-admin-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-admin-primary/25 transition-colors hover:bg-admin-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-card"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Clear all filters
          </motion.button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden border-admin-border/80 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.25)] dark:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.55)]">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3 p-3 sm:p-4 md:hidden"
      >
        {data.map((item) => (
          <NotificationMobileCard key={item.id} item={item} onView={onView} />
        ))}
      </motion.div>

      <div className="hidden md:block">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-0 table-fixed text-left text-sm lg:table-auto">
            <thead className="sticky top-0 z-10 border-b border-admin-border/90 bg-admin-card/90 text-[11px] font-semibold uppercase tracking-wider text-admin-muted-foreground backdrop-blur-md supports-backdrop-filter:bg-admin-card/75">
              <tr>
                <th className="whitespace-nowrap px-3 py-3.5 lg:px-4">Channel</th>
                <th className="whitespace-nowrap px-3 py-3.5 lg:w-[11%] lg:px-4">Template</th>
                <th className="min-w-0 px-3 py-3.5 lg:px-4">Recipient</th>
                <th className="whitespace-nowrap px-3 py-3.5 lg:w-[10%] lg:px-4">Status</th>
                <th className="whitespace-nowrap px-3 py-3.5 lg:w-[18%] lg:px-4">Activity</th>
                <th className="whitespace-nowrap px-3 py-3.5 text-right lg:px-4">Action</th>
              </tr>
            </thead>

            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="divide-y divide-admin-border/80"
            >
              {data.map((item: Notification) => (
                <NotificationRow key={item.id} item={item} onView={onView} />
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
