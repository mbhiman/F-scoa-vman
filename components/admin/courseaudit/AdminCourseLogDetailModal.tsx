"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Globe,
  Lock,
  ScrollText,
  User,
  X,
} from "lucide-react";
import { adminToastError } from "@/lib/admin-toast";
import { useAdminCourseLogDetails } from "@/hooks/admin/courseaudit";
import {
  AuditDetailSection,
  AuditErrorState,
  AuditMotionButton,
  auditPrimaryBtn,
  AuditPropertyGrid,
  AuditSpinner,
  AuditValidationBanner,
  CourseLogActionBadge,
  CourseLogMetadataDetails,
  CourseStatusBadge,
  formatActionLabel,
  formatAuditDate,
  formatAuditRelative,
} from "./course-audit-ui";

type Props = {
  logId: number | null;
  onClose: () => void;
};

export function AdminCourseLogDetailModal({ logId, onClose }: Props) {
  const lastToastErrorRef = useRef("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isInitialLoading, error, validationErrors, refetch } =
    useAdminCourseLogDetails(logId, { enabled: logId !== null });

  useEffect(() => {
    if (!error) {
      lastToastErrorRef.current = "";
      return;
    }
    if (error === lastToastErrorRef.current) return;
    lastToastErrorRef.current = error;
    adminToastError(error);
  }, [error]);

  useEffect(() => {
    if (logId === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [logId, onClose]);

  return (
    <AnimatePresence>
      {logId !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-log-detail-title"
            aria-describedby="course-log-detail-desc"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-admin-border/70 bg-admin-card shadow-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-admin-border/60 bg-admin-bg/40 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-admin-primary/20 bg-admin-primary/10 text-admin-primary">
                    <ScrollText className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-admin-primary">
                      Read-only audit record
                    </p>
                    <h2
                      id="course-log-detail-title"
                      className="text-lg font-bold tracking-tight text-admin-fg sm:text-xl"
                    >
                      Course log details
                    </h2>
                    <p
                      id="course-log-detail-desc"
                      className="mt-0.5 text-xs text-admin-muted-foreground"
                    >
                      Log #{logId}
                      {data?.created_at && formatAuditRelative(data.created_at)
                        ? ` · ${formatAuditRelative(data.created_at)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl p-2.5 text-admin-muted-foreground transition-colors hover:bg-admin-muted/10 hover:text-admin-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25"
                  aria-label="Close log details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {data && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <CourseLogActionBadge action={data.action} />
                  <span className="inline-flex items-center gap-1 rounded-full border border-admin-border bg-admin-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-admin-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden />
                    View only
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <AuditValidationBanner errors={validationErrors} />

              {isInitialLoading ? (
                <AuditSpinner label="Loading log details…" />
              ) : error && !data ? (
                <AuditErrorState
                  title="Log not found"
                  message={error}
                  onRetry={() => refetch()}
                />
              ) : data ? (
                <div className="space-y-5">
                  <AuditDetailSection title="Event summary" icon={ScrollText}>
                    <AuditPropertyGrid
                      rows={[
                        { label: "Log ID", value: data.id, mono: true },
                        { label: "Action", value: formatActionLabel(data.action) },
                        { label: "Recorded at", value: formatAuditDate(data.created_at) },
                        {
                          label: "IP address",
                          value: data.ip_address,
                          mono: true,
                        },
                      ]}
                    />
                    {!data.ip_address && (
                      <p className="mt-3 text-xs text-admin-muted-foreground">
                        IP address was not captured for this event.
                      </p>
                    )}
                  </AuditDetailSection>

                  <AuditDetailSection title="Acting admin" icon={User}>
                    {data.admin ? (
                      <AuditPropertyGrid
                        rows={[
                          { label: "Name", value: data.admin.name },
                          { label: "Email", value: data.admin.email },
                          { label: "Admin ID", value: data.admin.id, mono: true },
                        ]}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-admin-muted-foreground">
                        The admin account associated with this event is no longer available.
                      </p>
                    )}
                  </AuditDetailSection>

                  <AuditDetailSection title="Target course" icon={BookOpen}>
                    {data.course ? (
                      <div className="space-y-3">
                        <AuditPropertyGrid
                          rows={[
                            { label: "Title", value: data.course.title },
                            { label: "Course ID", value: data.course.id, mono: true },
                          ]}
                        />
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[12px] font-medium text-admin-muted-foreground">
                            Status at time of log:
                          </span>
                          <CourseStatusBadge status={data.course.status} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-admin-muted-foreground">
                        The course referenced by this event has been permanently deleted from
                        the system.
                      </p>
                    )}
                  </AuditDetailSection>

                  <section className="rounded-xl border border-admin-border bg-admin-bg/20 p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-semibold text-admin-fg">
                      Event context
                    </h3>
                    <CourseLogMetadataDetails metadata={data.metadata} action={data.action} />
                  </section>

                  {data.ip_address && (
                    <p className="flex items-center gap-2 rounded-lg border border-admin-border/60 bg-admin-bg/30 px-3 py-2.5 text-xs text-admin-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-admin-primary" aria-hidden />
                      Request originated from{" "}
                      <span className="font-mono text-admin-fg">{data.ip_address}</span>
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-admin-border/60 bg-admin-bg/30 px-5 py-3 sm:px-6">
              <div className="flex justify-end">
                <AuditMotionButton type="button" onClick={onClose} className={auditPrimaryBtn}>
                  Close
                </AuditMotionButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
