"use client";

import { RotateCcw, Search } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { NotificationFilters as NotificationFilterState } from "@/hooks/useNotifications";

type Props = {
  filters: NotificationFilterState;
  onChange: (filters: NotificationFilterState) => void;
  onReset: () => void;
};

const inputClass =
  "h-11 rounded-xl border border-admin-border bg-admin-card px-3 text-sm text-admin-fg outline-none transition-all placeholder:text-admin-muted-foreground focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/10";

export default function NotificationFilters({ filters, onChange, onReset }: Props) {
  const updateFilter = (key: keyof NotificationFilterState, value: string | number) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  return (
    <motion.section variants={slideUp} className="admin-card p-4">
      <div className="grid gap-3 xl:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted-foreground" />
          <input
            type="search"
            value={filters.search ?? ""}
            placeholder="Search recipient email or phone"
            className={`${inputClass} w-full pl-9`}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </label>

        <select
          value={filters.channel ?? ""}
          onChange={(e) => updateFilter("channel", e.target.value)}
          className={`${inputClass} w-full`}
        >
          <option value="">All channels</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
        </select>

        <select
          value={filters.status ?? ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className={`${inputClass} w-full`}
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          value={filters.template ?? ""}
          onChange={(e) => updateFilter("template", e.target.value)}
          className={`${inputClass} w-full`}
        >
          <option value="">All templates</option>
          <option value="otp">OTP</option>
          <option value="welcome">Welcome</option>
          <option value="resetPassword">Reset Password</option>
        </select>

        <input
          type="date"
          value={filters.from ?? ""}
          className={`${inputClass} w-full`}
          onChange={(e) => updateFilter("from", e.target.value)}
          aria-label="From date"
        />

        <input
          type="date"
          value={filters.to ?? ""}
          className={`${inputClass} w-full`}
          onChange={(e) => updateFilter("to", e.target.value)}
          aria-label="To date"
        />

        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-admin-border px-4 text-sm font-medium text-admin-muted-foreground transition-colors hover:bg-admin-primary/10 hover:text-admin-primary"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
      </div>
    </motion.section>
  );
}