"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, RotateCcw } from "lucide-react";
import type { NotificationFilters as NotificationFilterState } from "@/hooks/useNotifications";

type Props = {
  filters: NotificationFilterState;
  onChange: (filters: NotificationFilterState) => void;
  onReset: () => void;
};

// Flat, minimal input class
const inputClass = "h-10 w-full rounded-lg border border-admin-border bg-admin-card px-3 text-[13px] text-admin-fg shadow-sm outline-none transition-all placeholder:text-admin-muted-foreground focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold text-admin-fg uppercase tracking-wider">
      {children}
    </span>
  );
}

// --- Custom Animated Dropdown adapted for Admin UI ---
function AdminFancyDropdown({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value) ?? { label: placeholder, value: "" };

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex h-10 w-full items-center justify-between gap-3 rounded-lg border bg-admin-card px-3 text-left transition-[border-color,box-shadow,background-color] duration-200 border-admin-border shadow-sm hover:border-admin-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-admin-primary/20 ${open ? "border-admin-primary shadow-md ring-2 ring-admin-primary/15" : ""}`}
      >
        <span className={`truncate text-[13px] font-medium ${value ? "text-admin-fg" : "text-admin-muted-foreground"}`}>
          {active.label}
        </span>
        <span className="flex items-center text-admin-muted-foreground transition-colors group-hover:text-admin-fg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.985 }}
            transition={{ duration: 0.17, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-0 right-0 z-50 mt-1.5 w-full origin-top overflow-hidden rounded-xl border border-admin-border bg-admin-card/95 shadow-[0_22px_48px_-20px_rgba(0,0,0,0.38)] backdrop-blur-md"
            role="listbox"
          >
            <div className="max-h-60 overflow-auto p-1.5 custom-scrollbar">
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value || "__all"}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-[background-color,color,transform] duration-150 hover:bg-admin-primary/10 hover:text-admin-fg active:scale-[0.99] ${selected ? "bg-admin-primary/10 font-semibold text-admin-primary" : "text-admin-fg"}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected && (
                      <span className="text-admin-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NotificationFilters({ filters, onChange, onReset }: Props) {
  const updateFilter = (key: keyof NotificationFilterState, value: string | number) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <section className="bg-admin-card rounded-xl border border-admin-border/60 p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Search */}
          <div className="lg:col-span-1">
            <FieldLabel>Search Recipient</FieldLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted-foreground" />
              <input
                type="text"
                value={filters.search ?? ""}
                placeholder="Email or phone..."
                className={`${inputClass} pl-9`}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
          </div>

          {/* Channel */}
          <div>
            <FieldLabel>Channel</FieldLabel>
            <AdminFancyDropdown
              ariaLabel="Channel filter"
              placeholder="All channels"
              value={(filters.channel ?? "") as string}
              onChange={(v) => updateFilter("channel", v)}
              options={[
                { value: "", label: "All channels" },
                { value: "EMAIL", label: "Email" },
                { value: "WHATSAPP", label: "WhatsApp" },
                { value: "SMS", label: "SMS" },
              ]}
            />
          </div>

          {/* Status */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <AdminFancyDropdown
              ariaLabel="Status filter"
              placeholder="All status"
              value={(filters.status ?? "") as string}
              onChange={(v) => updateFilter("status", v)}
              options={[
                { value: "", label: "All status" },
                { value: "SENT", label: "Sent" },
                { value: "FAILED", label: "Failed" },
                { value: "PENDING", label: "Pending" },
              ]}
            />
          </div>

          {/* Template */}
          <div>
            <FieldLabel>Template</FieldLabel>
            <AdminFancyDropdown
              ariaLabel="Template filter"
              placeholder="All templates"
              value={(filters.template ?? "") as string}
              onChange={(v) => updateFilter("template", v)}
              options={[
                { value: "", label: "All templates" },
                { value: "otp", label: "OTP" },
                { value: "welcome", label: "Welcome" },
                { value: "resetPassword", label: "Reset Password" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 items-end border-t border-admin-border/40 pt-4 mt-2">
          <div>
            <FieldLabel>Date From</FieldLabel>
            <input
              type="date"
              value={filters.from ?? ""}
              className={inputClass}
              onChange={(e) => updateFilter("from", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Date To</FieldLabel>
            <input
              type="date"
              value={filters.to ?? ""}
              className={inputClass}
              onChange={(e) => updateFilter("to", e.target.value)}
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-admin-border bg-admin-bg/50 px-4 text-[13px] font-medium text-admin-fg hover:bg-admin-muted/10 transition-colors w-full sm:w-auto active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}