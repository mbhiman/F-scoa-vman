"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { buttonHover, buttonTap, slideUp } from "@/lib/animation/animations";
import type { NotificationFilters as NotificationFilterState } from "@/hooks/useNotifications";

type Props = {
  filters: NotificationFilterState;
  onChange: (filters: NotificationFilterState) => void;
  onReset: () => void;
};

const inputClass =
  "h-11 w-full rounded-xl border border-admin-border bg-admin-card px-3 text-sm text-admin-fg shadow-sm outline-none transition-all placeholder:text-admin-muted-foreground focus:border-admin-primary focus:ring-4 focus:ring-admin-primary/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

type SelectOption<T extends string> = { value: T | ""; label: string };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-admin-muted-foreground">
      {children}
    </span>
  );
}

function ModernSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: Array<SelectOption<T>>;
  placeholder: string;
  ariaLabel: string;
}) {
  const buttonId = useId();
  const listboxId = useMemo(() => `listbox-${buttonId}`, [buttonId]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    (value ? String(value) : placeholder);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={buttonId}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`${inputClass} group inline-flex items-center justify-between gap-3 px-3 text-left hover:border-admin-primary/50`}
      >
        <span className={`min-w-0 flex-1 truncate ${value ? "text-admin-fg" : "text-admin-muted-foreground"}`}>
          {selectedLabel}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {value ? (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-admin-primary shadow-[0_0_0_3px_rgba(22,66,185,0.15)] dark:shadow-[0_0_0_3px_rgba(64,128,248,0.2)]"
              aria-hidden
            />
          ) : null}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-admin-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key={listboxId}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            role="listbox"
            id={listboxId}
            aria-labelledby={buttonId}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-admin-border bg-admin-card/95 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:bg-admin-card/98 dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]"
          >
            <div className="max-h-64 overflow-auto p-1.5">
              <div className="flex flex-col gap-1">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value || "__all"}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/35 ${
                        isSelected
                          ? "border-admin-primary/35 bg-admin-primary/12 text-admin-primary"
                          : "border-transparent text-admin-fg hover:border-admin-border hover:bg-admin-primary/8"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function NotificationFilters({ filters, onChange, onReset }: Props) {
  const updateFilter = (key: keyof NotificationFilterState, value: string | number) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  return (
    <motion.section
      variants={slideUp}
      className="admin-card relative z-30 overflow-visible border-admin-border/80 p-4 shadow-[0_8px_32px_-16px_rgba(15,23,42,0.14)] sm:p-5 lg:sticky lg:top-4 lg:z-30 dark:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.45)]"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-border/60 pb-4">
        <div className="flex items-center gap-2 text-admin-fg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-admin-primary/10 text-admin-primary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Filters</h2>
            <p className="text-xs text-admin-muted-foreground">
              Narrow logs by channel, status, template, or date range
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-x-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <FieldLabel>Search</FieldLabel>
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={filters.search ?? ""}
                placeholder="Email or phone…"
                className={`${inputClass} pl-10`}
                onChange={(e) => updateFilter("search", e.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>
          </div>

          <div className="xl:col-span-2">
            <FieldLabel>Channel</FieldLabel>
            <ModernSelect
              ariaLabel="Channel filter"
              placeholder="All channels"
              value={(filters.channel ?? "") as "" | "EMAIL" | "WHATSAPP" | "SMS"}
              onChange={(v) => updateFilter("channel", v)}
              options={[
                { value: "", label: "All channels" },
                { value: "EMAIL", label: "Email" },
                { value: "WHATSAPP", label: "WhatsApp" },
                { value: "SMS", label: "SMS" },
              ]}
            />
          </div>

          <div className="xl:col-span-2">
            <FieldLabel>Status</FieldLabel>
            <ModernSelect
              ariaLabel="Status filter"
              placeholder="All statuses"
              value={
                (filters.status ?? "") as
                  | ""
                  | "SENT"
                  | "FAILED"
                  | "PENDING"
              }
              onChange={(v) => updateFilter("status", v)}
              options={[
                { value: "", label: "All statuses" },
                { value: "SENT", label: "Sent" },
                { value: "FAILED", label: "Failed" },
                { value: "PENDING", label: "Pending" },
              ]}
            />
          </div>

          <div className="xl:col-span-4">
            <FieldLabel>Template</FieldLabel>
            <ModernSelect
              ariaLabel="Template filter"
              placeholder="All templates"
              value={(filters.template ?? "") as "" | "otp" | "welcome" | "resetPassword"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end xl:gap-x-4">
          <div className="xl:col-span-2">
            <FieldLabel>From</FieldLabel>
            <input
              type="date"
              value={filters.from ?? ""}
              className={inputClass}
              onChange={(e) => updateFilter("from", e.target.value)}
              aria-label="From date"
            />
          </div>
          <div className="xl:col-span-2">
            <FieldLabel>To</FieldLabel>
            <input
              type="date"
              value={filters.to ?? ""}
              className={inputClass}
              onChange={(e) => updateFilter("to", e.target.value)}
              aria-label="To date"
            />
          </div>
          <div className="sm:col-span-2 xl:col-span-8 xl:flex xl:justify-end">
            <motion.button
              type="button"
              whileHover={buttonHover}
              whileTap={buttonTap}
              onClick={onReset}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-5 text-sm font-semibold text-admin-muted-foreground shadow-sm transition-colors hover:border-admin-primary/35 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 xl:w-auto xl:min-w-40"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset filters
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
