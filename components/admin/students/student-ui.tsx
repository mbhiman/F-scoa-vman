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
  Users,
} from "lucide-react";
import {
  buttonHover,
  buttonTap,
  fadeIn,
  slideUp,
  slideUpCompact,
  staggerContainer,
} from "@/lib/animation/animations";
import type {
  AdminStudentCourse,
  AdminStudentStatus,
  LatestAttemptStatus,
  StudentCourseStatus,
} from "@/hooks/admin/students";

/** Admin UI route for learner list & profiles */
export const ADMIN_LEARNERS_BASE_PATH = "/admin/learners";

/* ── Layout tokens (theme-only) ── */
export const learnerShell = "mx-auto w-full max-w-6xl space-y-6 sm:space-y-8";
export const learnerPageHeader =
  "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between";
export const learnerCard =
  "admin-card transition-shadow duration-300 hover:shadow-admin-card-hover";
export const learnerToolbar =
  "flex flex-col gap-4 border-b border-admin-border bg-admin-bg/80 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between backdrop-blur-sm";
export const learnerInputWrap =
  "flex h-11 w-full items-center gap-2.5 rounded-xl border border-admin-border bg-admin-card px-3.5 text-sm shadow-sm transition-all duration-200 focus-within:border-admin-primary focus-within:ring-2 focus-within:ring-admin-primary/15 hover:border-admin-primary/40";
export const learnerIconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-admin-border bg-admin-card text-admin-muted-foreground shadow-sm transition-all duration-200 hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary active:scale-95 disabled:pointer-events-none disabled:opacity-50";
export const learnerPrimaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-sm font-semibold text-admin-fg shadow-sm transition-all duration-200 hover:border-admin-primary/40 hover:bg-admin-primary/5 hover:text-admin-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const learnerGhostLink =
  "inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-admin-muted-foreground transition-colors duration-200 hover:bg-admin-muted/10 hover:text-admin-fg";

/* ── Motion wrappers ── */
export function LearnerFadeIn({
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
      variants={fadeIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LearnerSlideUp({
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

export function LearnerStagger({
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

export function LearnerStaggerItem({
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

export function MotionIconButton({
  children,
  className = "",
  onClick,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={buttonHover}
      whileTap={buttonTap}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ── Formatters ── */
export function formatGender(gender: string): string {
  if (gender === "MALE") return "Male";
  if (gender === "FEMALE") return "Female";
  if (gender === "OTHER") return "Other";
  return gender;
}

export function studentInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Badges ── */
const badgeBase =
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide";

export function StudentStatusBadge({ status }: { status: AdminStudentStatus }) {
  if (status === "ACTIVE") {
    return <span className={`${badgeBase} badge-success`}>Active</span>;
  }
  if (status === "BLOCKED") {
    return <span className={`${badgeBase} badge-error`}>Blocked</span>;
  }
  return <span className={`${badgeBase} badge-muted`}>Abandoned</span>;
}

export function CourseStatusBadge({ status }: { status: StudentCourseStatus }) {
  if (status === "PASSED") return <span className={`${badgeBase} badge-success`}>Passed</span>;
  if (status === "FAILED") return <span className={`${badgeBase} badge-error`}>Failed</span>;
  if (status === "IN_PROGRESS") {
    return <span className={`${badgeBase} badge-admin-accent`}>In progress</span>;
  }
  return <span className={`${badgeBase} badge-muted`}>Not started</span>;
}

/** Single course status for tables/cards — no duplicate passed + course_status labels */
export function CourseEnrollmentStatusBadge({ course }: { course: AdminStudentCourse }) {
  const status = resolveCourseEnrollmentStatus(course);
  return <CourseStatusBadge status={status} />;
}

function resolveCourseEnrollmentStatus(course: AdminStudentCourse): StudentCourseStatus {
  if (course.course_status === "PASSED" || course.course_status === "FAILED") {
    return course.course_status;
  }
  if (course.passed === true) return "PASSED";
  if (course.passed === false && course.attempts_count > 0) return "FAILED";
  return course.course_status;
}

export function AttemptStatusBadge({ status }: { status: LatestAttemptStatus }) {
  if (!status) return <span className={`${badgeBase} badge-muted`}>—</span>;
  if (status === "SUBMITTED") return <span className={`${badgeBase} badge-success`}>Submitted</span>;
  if (status === "TIMED_OUT") return <span className={`${badgeBase} badge-error`}>Timed out</span>;
  return <span className={`${badgeBase} badge-admin-accent`}>In progress</span>;
}

export function LearnerAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl sm:h-[4.5rem] sm:w-[4.5rem] sm:text-2xl",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-admin-primary to-admin-primary-hover font-bold text-white shadow-md ring-2 ring-admin-primary/20 ${sizes[size]}`}
    >
      {studentInitials(name) || name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Search & filters ── */
export function LearnerSearchInput({
  value,
  onChange,
  placeholder = "Search by name, email, or mobile…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={learnerInputWrap}>
      <Search className="h-4 w-4 shrink-0 text-admin-muted-foreground" aria-hidden />
      <input
        type="search"
        aria-label="Search learners"
        className="min-w-0 flex-1 bg-transparent text-admin-fg outline-none placeholder:text-admin-muted"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function LearnerStatusSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel = "Filter by status",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
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
    <div ref={rootRef} className="relative w-full shrink-0 sm:w-[168px]">
      <motion.button
        type="button"
        whileHover={buttonHover}
        whileTap={buttonTap}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-admin-card px-3.5 text-left text-sm font-medium shadow-sm transition-all duration-200 ${
          open
            ? "border-admin-primary ring-2 ring-admin-primary/15"
            : "border-admin-border hover:border-admin-primary/40"
        }`}
      >
        <span className={value ? "truncate text-admin-fg" : "truncate text-admin-muted-foreground"}>
          {active?.label ?? "All Status"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-admin-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-admin-primary" : ""}`}
          aria-hidden
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-1.5 overflow-hidden rounded-xl border border-admin-border bg-admin-card shadow-[0_12px_32px_-10px_rgba(0,0,0,0.18)]"
            role="listbox"
            aria-label={ariaLabel}
          >
            <ul className="max-h-56 overflow-auto p-1.5 custom-scrollbar">
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
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors duration-150 ${
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

/* ── States ── */
export function LearnerSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24" role="status">
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-2 border-admin-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
      </div>
      {label && (
        <p className="text-sm font-medium text-admin-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

export function LearnerListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-admin-border px-4 sm:px-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 py-4">
          <div className="h-12 w-12 rounded-2xl bg-admin-muted/15" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 max-w-[60%] rounded-lg bg-admin-muted/15" />
            <div className="h-3 w-28 rounded-lg bg-admin-muted/10" />
          </div>
          <div className="hidden h-6 w-16 rounded-full bg-admin-muted/15 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function LearnerProfileSkeleton() {
  return (
    <div className={`${learnerShell} animate-pulse`}>
      <div className="h-5 w-32 rounded-lg bg-admin-muted/15" />
      <div className={`${learnerCard} p-6 sm:p-8`}>
        <div className="flex gap-5">
          <div className="h-16 w-16 rounded-2xl bg-admin-muted/15" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded-lg bg-admin-muted/15" />
            <div className="h-4 w-full max-w-md rounded-lg bg-admin-muted/10" />
            <div className="h-4 w-3/4 max-w-sm rounded-lg bg-admin-muted/10" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`${learnerCard} h-20`} />
        ))}
      </div>
    </div>
  );
}

export function LearnerErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpCompact}
      className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20"
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
        <MotionIconButton
          onClick={onRetry}
          className={`${learnerPrimaryBtn} mt-6 border-red-500/20 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600`}
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </MotionIconButton>
      )}
    </motion.div>
  );
}

export function LearnerEmptyState({
  icon: Icon = Users,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpCompact}
      className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-admin-primary/10 text-admin-primary ring-1 ring-admin-primary/15">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-base font-semibold text-admin-fg">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-admin-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function LearnerRefreshingBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-admin-border"
      role="progressbar"
      aria-label="Refreshing"
    >
      <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] bg-admin-primary" />
    </div>
  );
}
