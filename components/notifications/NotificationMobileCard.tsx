"use client";

import { Eye, Mail, MessageCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { Notification } from "@/hooks/useNotifications";
import NotificationStatusBadge from "./NotificationStatusBadge";

const channelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

type Props = {
  item: Notification;
  onView: (id: number) => void;
};

export default function NotificationMobileCard({ item, onView }: Props) {
  const ChannelIcon = channelIcons[item.channel];
  const title = item.subject ?? item.jobName ?? "No subject";
  const snippet = item.jobName && item.subject ? item.jobName : item.template;

  return (
    <motion.article
      variants={slideUp}
      layout
      className="group relative overflow-hidden rounded-2xl border border-admin-border/80 bg-admin-card/80 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200 hover:border-admin-primary/25 hover:shadow-[0_12px_40px_-12px_rgba(22,66,185,0.18)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] dark:hover:shadow-[0_12px_40px_-12px_rgba(64,128,248,0.15)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-admin-primary/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-admin-primary/15 to-admin-primary/5 text-admin-primary ring-1 ring-admin-primary/10">
            <ChannelIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-snug text-admin-fg">
              {item.recipient}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-admin-muted-foreground">
              {title}
            </p>
            {snippet && snippet !== title ? (
              <p className="mt-1 truncate text-xs text-admin-muted-foreground/90">
                {snippet}
              </p>
            ) : null}
          </div>
        </div>
        <NotificationStatusBadge status={item.status} className="shrink-0" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div className="rounded-xl border border-admin-border/70 bg-admin-bg/50 px-3 py-2 dark:bg-admin-bg/30">
          <dt className="font-medium text-admin-muted-foreground">Channel</dt>
          <dd className="mt-0.5 font-semibold text-admin-fg">{item.channel}</dd>
        </div>
        <div className="rounded-xl border border-admin-border/70 bg-admin-bg/50 px-3 py-2 dark:bg-admin-bg/30">
          <dt className="font-medium text-admin-muted-foreground">Template</dt>
          <dd className="mt-0.5 truncate font-semibold capitalize text-admin-fg">
            {item.template}
          </dd>
        </div>
        <div className="col-span-2 rounded-xl border border-admin-border/70 bg-admin-bg/50 px-3 py-2 dark:bg-admin-bg/30">
          <dt className="font-medium text-admin-muted-foreground">Activity</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-admin-fg">
            {formatDate(item.sentAt ?? item.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end">
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => onView(item.id)}
          className="inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-sm font-semibold text-admin-fg shadow-sm transition-colors hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-card"
        >
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          Details
        </motion.button>
      </div>
    </motion.article>
  );
}
