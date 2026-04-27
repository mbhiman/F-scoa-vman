"use client";

import { Eye, Mail, MessageCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { Notification } from "@/hooks/useNotifications";

type Props = {
  item: Notification;
  onView: (id: number) => void;
};

const channelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
};

const statusClass = {
  SENT: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  PENDING: "bg-amber-500/10 text-amber-500",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not sent";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString();
};

export default function NotificationRow({ item, onView }: Props) {
  const ChannelIcon = channelIcons[item.channel];

  return (
    <motion.tr
      variants={slideUp}
      className="border-b border-admin-border transition-colors last:border-0 hover:bg-admin-primary/5"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-admin-primary/10 text-admin-primary">
            <ChannelIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-admin-fg">{item.channel}</p>
            <p className="text-xs text-admin-muted-foreground">{item.provider ?? "Provider pending"}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="badge-admin-accent capitalize">{item.template}</span>
      </td>

      <td className="px-4 py-4">
        <p className="max-w-[260px] truncate font-medium text-admin-fg">{item.recipient}</p>
        <p className="max-w-[260px] truncate text-xs text-admin-muted-foreground">
          {item.subject ?? item.jobName ?? "No subject"}
        </p>
      </td>

      <td className="px-4 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}>
          {item.status}
        </span>
      </td>

      <td className="px-4 py-4 text-sm text-admin-muted-foreground">
        {formatDate(item.sentAt ?? item.createdAt)}
      </td>

      <td className="px-4 py-4 text-right">
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => onView(item.id)}
          className="inline-flex items-center gap-2 rounded-xl border border-admin-border px-3 py-2 text-xs font-semibold text-admin-fg transition-colors hover:border-admin-primary hover:text-admin-primary"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </motion.button>
      </td>
    </motion.tr>
  );
}