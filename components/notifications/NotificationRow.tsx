"use client";

import { Eye, Mail, MessageCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { Notification } from "@/hooks/useNotifications";
import NotificationStatusBadge from "./NotificationStatusBadge";

type Props = {
  item: Notification;
  onView: (id: number) => void;
};

const channelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not sent";

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

export default function NotificationRow({ item, onView }: Props) {
  const ChannelIcon = channelIcons[item.channel];

  return (
    <motion.tr
      variants={slideUp}
      className="border-b border-admin-border/70 transition-colors last:border-0 hover:bg-admin-primary/4"
    >
      <td className="px-3 py-4 align-middle lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-admin-primary/15 to-admin-primary/5 text-admin-primary ring-1 ring-admin-primary/10">
            <ChannelIcon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-snug text-admin-fg">{item.channel}</p>
            <p className="truncate text-xs text-admin-muted-foreground">
              {item.provider ?? "Provider pending"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-4 align-middle lg:px-4">
        <span className="badge-admin-accent inline-block max-w-full truncate capitalize">
          {item.template}
        </span>
      </td>

      <td className="max-w-0 px-3 py-4 align-middle lg:max-w-none lg:px-4">
        <p className="truncate font-medium text-admin-fg lg:max-w-[320px] xl:max-w-[400px]">
          {item.recipient}
        </p>
        <p className="truncate text-xs text-admin-muted-foreground lg:max-w-[320px] xl:max-w-[400px]">
          {item.subject ?? item.jobName ?? "No subject"}
        </p>
      </td>

      <td className="px-3 py-4 align-middle lg:px-4">
        <NotificationStatusBadge status={item.status} size="md" />
      </td>

      <td className="whitespace-nowrap px-3 py-4 align-middle text-sm tabular-nums text-admin-muted-foreground lg:px-4">
        {formatDate(item.sentAt ?? item.createdAt)}
      </td>

      <td className="px-3 py-4 text-right align-middle lg:px-4">
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => onView(item.id)}
          className="inline-flex min-h-10 min-w-[44px] items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-3 py-2 text-xs font-semibold text-admin-fg shadow-sm transition-colors hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Details
        </motion.button>
      </td>
    </motion.tr>
  );
}
