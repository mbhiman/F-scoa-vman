"use client";

import { Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animation/animations";
import type { Notification } from "@/hooks/useNotifications";
import NotificationRow from "./NotificationRow";

export default function NotificationTable({
  data,
  loading,
  error,
  onView,
}: {
  data: Notification[];
  loading: boolean;
  error?: string;
  onView: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="admin-card overflow-hidden">
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-admin-primary/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-red-500/10 p-3 text-red-500">
          <Inbox className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-admin-fg">Unable to load notification logs</h3>
          <p className="mt-1 text-sm text-admin-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="admin-card flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-admin-primary/10 p-3 text-admin-primary">
          <Inbox className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-admin-fg">No notification logs found</h3>
          <p className="mt-1 text-sm text-admin-muted-foreground">
            Try adjusting your filters or date range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-admin-border bg-admin-primary/5 text-xs uppercase tracking-wide text-admin-muted-foreground">
          <tr>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Activity Time</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>

        <motion.tbody
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="divide-y divide-admin-border"
        >
          {data.map((item: any) => (
            <NotificationRow
              key={item.id}
              item={item}
              onView={onView}
            />
          ))}
        </motion.tbody>
      </table>
      </div>
    </div>
  );
}