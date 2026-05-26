"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  buttonHover,
  buttonTap,
  fadeIn,
  slideUp,
  slideUpCompact,
  staggerContainer,
} from "@/lib/animation/animations";
import type { CourseLogAction, CourseLogMetadata } from "@/hooks/admin/courseaudit";
import type { CourseStatus } from "@/hooks/coursebuilder/shared";

export const COURSE_AUDIT_BASE_PATH = "/admin/audit-logs";

/* ── Layout tokens ── */
export const auditCard =
  "admin-card transition-shadow duration-300 hover:shadow-admin-card-hover";
export const auditToolbar =
  "flex flex-col gap-5 border-b border-admin-border bg-admin-bg/80 px-4 py-5 sm:px-6 sm:py-6 backdrop-blur-sm";
export const auditInputWrap =
  "flex h-11 w-full items-center gap-2.5 rounded-xl border border-admin-border bg-admin-card px-3.5 text-sm shadow-sm transition-all duration-200 focus-within:border-admin-primary focus-within:ring-2 focus-within:ring-admin-primary/15 hover:border-admin-primary/40";
export const auditFieldInput =
  "input-field h-11 w-full rounded-xl border-admin-border bg-admin-card py-2 text-sm shadow-sm transition-all duration-200 hover:border-admin-primary/40 focus:border-admin-primary";
export const auditFieldLabel =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-admin-muted-foreground";
export const auditIconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-admin-border bg-admin-card text-admin-muted-foreground shadow-sm transition-all duration-200 hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50";
export const auditPrimaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-sm font-semibold text-admin-fg shadow-sm transition-all duration-200 hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const badgeBase =
  "inline-flex max-w-full items-center gap-1 truncate px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide";

export const ACTION_LABELS: Record<CourseLogAction, string> = {
  COURSE_CREATED: "Course created",
  COURSE_UPDATED: "Course updated",
  COURSE_PUBLISHED: "Course published",
  COURSE_DISABLED: "Course disabled",
  COURSE_DELETED: "Course deleted",
  ENROLLMENT_FORM_SAVED: "Enrollment form saved",
  QUIZ_SAVED: "Quiz saved",
  EXAM_SETTINGS_SAVED: "Exam settings saved",
  CERTIFICATE_SAVED: "Certificate saved",
};

const ACTION_STYLES: Record<
  CourseLogAction,
  { badge: string; dot: string }
> = {
  COURSE_CREATED: { badge: "badge-success", dot: "bg-emerald-500" },
  COURSE_UPDATED: { badge: "badge-admin-accent", dot: "bg-admin-primary" },
  COURSE_PUBLISHED: { badge: "badge-success", dot: "bg-emerald-500" },
  COURSE_DISABLED: { badge: "badge-error", dot: "bg-red-500" },
  COURSE_DELETED: { badge: "badge-error", dot: "bg-red-500" },
  ENROLLMENT_FORM_SAVED: { badge: "badge-muted", dot: "bg-admin-muted" },
  QUIZ_SAVED: { badge: "badge-muted", dot: "bg-admin-muted" },
  EXAM_SETTINGS_SAVED: { badge: "badge-admin-accent", dot: "bg-amber-500" },
  CERTIFICATE_SAVED: { badge: "badge-admin-accent", dot: "bg-amber-500" },
};

export function formatActionLabel(action: CourseLogAction | string): string {
  if (action in ACTION_LABELS) return ACTION_LABELS[action as CourseLogAction];
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAuditDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAuditRelative(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatAuditDateShort(value);
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value || "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map(String).join(", ");
  }
  return JSON.stringify(value, null, 2);
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Motion ── */
export function AuditFadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className={className}>
      {children}
    </motion.div>
  );
}

export function AuditSlideUp({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AuditStagger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AuditStaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={slideUpCompact} className={className}>
      {children}
    </motion.div>
  );
}

type AuditMotionButtonProps = {
  children: React.ReactNode;
  className?: string;
} & Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "type"
  | "id"
  | "onClick"
  | "disabled"
  | "title"
  | "aria-label"
  | "aria-expanded"
  | "aria-controls"
  | "aria-haspopup"
  | "aria-labelledby"
>;

export function AuditMotionButton({
  children,
  className = "",
  type = "button",
  id,
  onClick,
  disabled,
  title,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  "aria-haspopup": ariaHaspopup,
  "aria-labelledby": ariaLabelledby,
}: AuditMotionButtonProps) {
  return (
    <motion.button
      type={type}
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHaspopup}
      aria-labelledby={ariaLabelledby}
      whileHover={disabled ? undefined : buttonHover}
      whileTap={disabled ? undefined : buttonTap}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ── States ── */
export function AuditRefreshingBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-admin-border"
      role="progressbar"
      aria-label="Refreshing logs"
    >
      <div className="h-full w-1/3 animate-pulse bg-admin-primary" />
    </div>
  );
}

export function AuditSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24" role="status">
      <div className="relative h-11 w-11" aria-hidden>
        <div className="absolute inset-0 rounded-full border-2 border-admin-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
      </div>
      {label && (
        <p className="text-sm font-medium text-admin-muted-foreground">{label}</p>
      )}
    </div>
  );
}

export function AuditListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-admin-border px-4 sm:px-6" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 py-4">
          <div className="h-10 w-24 rounded-lg bg-admin-muted/15" />
          <div className="h-6 w-28 rounded-full bg-admin-muted/15" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 max-w-[50%] rounded-lg bg-admin-muted/15" />
            <div className="h-3 w-32 rounded-lg bg-admin-muted/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpCompact}
      className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-admin-primary/10 text-admin-primary ring-1 ring-admin-primary/15">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-base font-semibold text-admin-fg">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-admin-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function AuditErrorState({
  title = "Could not load course logs",
  message,
  onRetry,
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpCompact}
      className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20"
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-base font-semibold text-admin-fg">{title}</p>
      {message && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-admin-muted-foreground">
          {message}
        </p>
      )}
      {onRetry && (
        <AuditMotionButton
          type="button"
          onClick={onRetry}
          className={`${auditPrimaryBtn} mt-6`}
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </AuditMotionButton>
      )}
    </motion.div>
  );
}

export function AuditValidationBanner({
  errors,
}: {
  errors: { field: string; message: string }[];
}) {
  if (errors.length === 0) return null;
  return (
    <div
      className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:px-6"
      role="alert"
    >
      <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
        {errors.map((e) => (
          <li key={`${e.field}-${e.message}`}>
            <span className="font-semibold">{e.field}:</span> {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Inputs ── */
export function AuditSearchInput({
  value,
  onChange,
  placeholder = "Search admin name, email, or course title…",
  id = "course-log-search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className={auditInputWrap}>
      <Search className="h-4 w-4 shrink-0 text-admin-muted-foreground" aria-hidden />
      <input
        id={id}
        type="search"
        aria-label="Search course audit logs"
        className="min-w-0 flex-1 bg-transparent text-admin-fg outline-none placeholder:text-admin-muted"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function AuditActionSelect<T extends string>({
  value,
  onChange,
  options,
  id = "course-log-action-filter",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
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
    <div ref={rootRef} className="relative w-full shrink-0 sm:w-[200px]">
      <AuditMotionButton
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by action type"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full items-center justify-between gap-2 px-3.5 text-left text-sm font-medium ${auditFieldInput} ${
          open ? "border-admin-primary ring-2 ring-admin-primary/15" : ""
        }`}
      >
        <span className={value ? "truncate text-admin-fg" : "truncate text-admin-muted-foreground"}>
          {active?.label ?? "All Actions"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-admin-primary" : "text-admin-muted-foreground"}`}
          aria-hidden
        />
      </AuditMotionButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="mt-1.5 overflow-hidden rounded-xl border border-admin-border bg-admin-card shadow-[0_12px_32px_-10px_rgba(0,0,0,0.18)]"
            role="listbox"
            aria-labelledby={id}
          >
            <ul className="max-h-60 overflow-auto p-1.5 custom-scrollbar">
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <li key={String(opt.value) || "all"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                        selected
                          ? "bg-admin-primary/10 font-semibold text-admin-primary"
                          : "text-admin-fg hover:bg-admin-muted/10"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AuditField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className={auditFieldLabel}>{label}</span>
      {children}
    </label>
  );
}

/* ── Display helpers ── */
export function NullPlaceholder({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-admin-muted/10 px-2 py-0.5 text-xs font-medium italic text-admin-muted-foreground">
      {children}
    </span>
  );
}

export function CourseLogActionBadge({ action }: { action: CourseLogAction | string }) {
  const label = formatActionLabel(action);
  const styles =
    action in ACTION_STYLES
      ? ACTION_STYLES[action as CourseLogAction]
      : { badge: "badge-muted", dot: "bg-admin-muted" };

  return (
    <span className={`${badgeBase} ${styles.badge}`} title={String(action)}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} aria-hidden />
      {label}
    </span>
  );
}

export function CourseStatusBadge({ status }: { status: CourseStatus | string }) {
  if (status === "PUBLISHED") return <span className={`${badgeBase} badge-success`}>Published</span>;
  if (status === "DISABLED") return <span className={`${badgeBase} badge-error`}>Disabled</span>;
  return <span className={`${badgeBase} badge-muted`}>Draft</span>;
}

export function AuditTimestamp({
  value,
  showRelative = true,
}: {
  value: string | null | undefined;
  showRelative?: boolean;
}) {
  if (!value) return <NullPlaceholder>Date unavailable</NullPlaceholder>;
  const relative = showRelative ? formatAuditRelative(value) : "";
  return (
    <div className="min-w-0">
      <time dateTime={value} className="block text-sm font-medium text-admin-fg">
        {formatAuditDateShort(value)}
      </time>
      {relative && (
        <p className="mt-0.5 text-[11px] text-admin-muted-foreground">{relative}</p>
      )}
      <p className="mt-0.5 hidden text-[10px] text-admin-muted-foreground/80 sm:block">
        {formatAuditDate(value)}
      </p>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-admin-border/60 bg-admin-bg/40 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-admin-muted-foreground shrink-0">
        {label}
      </dt>
      <dd className="text-sm font-medium text-admin-fg wrap-break-word sm:text-right">{value}</dd>
    </div>
  );
}

function renderActionSpecificMetadata(
  metadata: CourseLogMetadata,
  action: CourseLogAction | string,
): React.ReactNode {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  if (action === "COURSE_UPDATED" && Array.isArray(metadata.changed_fields)) {
    const fields = metadata.changed_fields as string[];
    return (
      <div className="space-y-2">
        <p className={auditFieldLabel}>Changed fields</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Changed fields">
          {fields.map((field) => (
            <li key={field} className="badge-muted px-2.5 py-1 text-[11px] font-medium">
              {field}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (action === "COURSE_CREATED") {
    return (
      <dl className="space-y-2">
        {"title" in metadata && (
          <MetadataRow label="Title" value={formatMetadataValue(metadata.title)} />
        )}
        {"is_ncvet" in metadata && (
          <MetadataRow label="NCVET" value={formatMetadataValue(metadata.is_ncvet)} />
        )}
        {"has_thumbnail" in metadata && (
          <MetadataRow label="Thumbnail" value={formatMetadataValue(metadata.has_thumbnail)} />
        )}
      </dl>
    );
  }

  if (action === "COURSE_PUBLISHED" || action === "COURSE_DISABLED") {
    return (
      <MetadataRow
        label="New status"
        value={formatMetadataValue(metadata.new_status ?? metadata)}
      />
    );
  }

  if (action === "COURSE_DELETED") {
    return (
      <dl className="space-y-2">
        {"had_thumbnail" in metadata && (
          <MetadataRow label="Had thumbnail" value={formatMetadataValue(metadata.had_thumbnail)} />
        )}
        {"had_certificate" in metadata && (
          <MetadataRow
            label="Had certificate"
            value={formatMetadataValue(metadata.had_certificate)}
          />
        )}
      </dl>
    );
  }

  if (action === "ENROLLMENT_FORM_SAVED" && "groups_count" in metadata) {
    return <MetadataRow label="Groups" value={formatMetadataValue(metadata.groups_count)} />;
  }

  if (action === "QUIZ_SAVED" && "questions_count" in metadata) {
    return (
      <MetadataRow label="Questions" value={formatMetadataValue(metadata.questions_count)} />
    );
  }

  if (action === "EXAM_SETTINGS_SAVED") {
    return (
      <dl className="space-y-2">
        {"is_create" in metadata && (
          <MetadataRow label="Mode" value={metadata.is_create ? "Created" : "Updated"} />
        )}
        {"duration_minutes" in metadata && (
          <MetadataRow
            label="Duration"
            value={`${formatMetadataValue(metadata.duration_minutes)} min`}
          />
        )}
        {"cooldown_hours" in metadata && (
          <MetadataRow
            label="Cooldown"
            value={`${formatMetadataValue(metadata.cooldown_hours)} hrs`}
          />
        )}
      </dl>
    );
  }

  if (action === "CERTIFICATE_SAVED" && "is_update" in metadata) {
    return (
      <MetadataRow
        label="Operation"
        value={metadata.is_update ? "Updated certificate" : "New certificate"}
      />
    );
  }

  return (
    <dl className="space-y-2">
      {Object.entries(metadata).map(([key, val]) => (
        <MetadataRow key={key} label={humanizeKey(key)} value={formatMetadataValue(val)} />
      ))}
    </dl>
  );
}

export function CourseLogMetadataPreview({
  metadata,
  action,
}: {
  metadata: CourseLogMetadata;
  action: CourseLogAction | string;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <NullPlaceholder>No metadata</NullPlaceholder>;
  }

  if (action === "COURSE_UPDATED" && Array.isArray(metadata.changed_fields)) {
    const fields = metadata.changed_fields as string[];
    return (
      <span className="line-clamp-2 text-xs text-admin-muted-foreground">
        <span className="font-medium text-admin-fg">Changed:</span>{" "}
        {fields.slice(0, 3).join(", ")}
        {fields.length > 3 ? ` +${fields.length - 3} more` : ""}
      </span>
    );
  }

  const preview = Object.entries(metadata)
    .slice(0, 2)
    .map(([k, v]) => `${humanizeKey(k)}: ${formatMetadataValue(v)}`)
    .join(" · ");

  return (
    <span className="line-clamp-2 text-xs text-admin-muted-foreground" title={preview}>
      {preview}
    </span>
  );
}

export function CourseLogMetadataDetails({
  metadata,
  action,
}: {
  metadata: CourseLogMetadata;
  action: CourseLogAction | string;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <p className="text-sm leading-relaxed text-admin-muted-foreground">
        No additional context was recorded for this event.
      </p>
    );
  }

  return <div className="space-y-3">{renderActionSpecificMetadata(metadata, action)}</div>;
}

export function AuditDetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-admin-border bg-admin-bg/20 p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-admin-fg">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-primary/10 text-admin-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AuditPropertyGrid({
  rows,
}: {
  rows: { label: string; value?: string | number | null; mono?: boolean }[];
}) {
  return (
    <dl className="divide-y divide-admin-border/50 rounded-lg border border-admin-border/60 bg-admin-card/50">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4"
        >
          <dt className="text-[12px] font-medium text-admin-muted-foreground">{row.label}</dt>
          <dd
            className={`sm:col-span-2 text-[13px] text-admin-fg wrap-break-word ${
              row.mono ? "font-mono text-[12px]" : "font-medium"
            }`}
          >
            {row.value ?? <NullPlaceholder>Not available</NullPlaceholder>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
