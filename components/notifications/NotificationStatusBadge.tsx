"use client";

import type { NotificationStatus } from "@/hooks/useNotifications";

const STATUS_STYLES: Record<
  NotificationStatus,
  { label: string; className: string }
> = {
  SENT: {
    label: "Sent",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  PENDING: {
    label: "Pending",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  SCHEDULED: {
    label: "Scheduled",
    className:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
};

type Props = {
  status: NotificationStatus;
  size?: "sm" | "md";
  className?: string;
};

export default function NotificationStatusBadge({
  status,
  size = "sm",
  className = "",
}: Props) {
  const meta =
    status in STATUS_STYLES
      ? STATUS_STYLES[status as NotificationStatus]
      : {
          label: String(status),
          className:
            "border-admin-border bg-admin-primary/5 text-admin-muted-foreground",
        };

  const sizeClass =
    size === "md"
      ? "px-3 py-1 text-xs sm:text-[13px]"
      : "px-2.5 py-0.5 text-[11px] sm:text-xs";

  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full border font-semibold tracking-wide ${sizeClass} ${meta.className} ${className}`}
      title={meta.label}
    >
      {meta.label}
    </span>
  );
}
