"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { PaginationMeta } from "@/hooks/useNotifications";

type Props = {
  meta: PaginationMeta;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
};

function visiblePageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export default function NotificationPagination({
  meta,
  loading,
  page,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, meta.totalPages || 1);
  const pages = visiblePageNumbers(page, totalPages);

  return (
    <motion.nav
      variants={slideUp}
      aria-label="Notification logs pagination"
      className="admin-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <p className="text-center text-sm text-admin-muted-foreground sm:text-left">
        Showing page{" "}
        <span className="font-semibold tabular-nums text-admin-fg">{meta.page}</span>{" "}
        of{" "}
        <span className="font-semibold tabular-nums text-admin-fg">{totalPages}</span>
        <span className="hidden sm:inline">
          {" "}
          ·{" "}
          <span className="font-medium tabular-nums text-admin-fg">{meta.total}</span>{" "}
          logs
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          disabled={!meta.hasPrev || loading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-admin-border px-3 text-admin-fg transition-colors hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p) => {
            const active = p === page;
            return (
              <motion.button
                key={p}
                type="button"
                whileHover={active ? undefined : buttonHover}
                whileTap={buttonTap}
                disabled={loading}
                onClick={() => onPageChange(p)}
                aria-current={active ? "page" : undefined}
                className={`min-h-10 min-w-10 rounded-xl text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 ${
                  active
                    ? "bg-admin-primary text-white shadow-md shadow-admin-primary/25"
                    : "border border-transparent text-admin-muted-foreground hover:border-admin-border hover:bg-admin-primary/5 hover:text-admin-fg"
                }`}
              >
                {p}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          disabled={!meta.hasNext || loading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-admin-border px-3 text-admin-fg transition-colors hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
