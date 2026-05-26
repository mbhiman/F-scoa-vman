"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarRange,
  ChevronDown,
  Eye,
  FilterX,
  Globe,
  Hash,
  RefreshCw,
  SlidersHorizontal,
  User,
} from "lucide-react";
import NotificationPagination from "@/components/notifications/NotificationPagination";
import { adminToastError } from "@/lib/admin-toast";
import {
  COURSE_LOG_ACTIONS,
  DEFAULT_ADMIN_COURSE_LOGS_LIMIT,
  DEFAULT_ADMIN_COURSE_LOGS_PAGE,
  useAdminCourseLogs,
  type AdminCourseLogListItem,
  type CourseLogAction,
} from "@/hooks/admin/courseaudit";
import { AuditCoursePicker } from "./AuditCoursePicker";
import {
  AuditActionSelect,
  AuditEmptyState,
  AuditErrorState,
  AuditFadeIn,
  AuditField,
  auditFieldInput,
  AuditListSkeleton,
  AuditMotionButton,
  AuditRefreshingBar,
  AuditSearchInput,
  AuditSlideUp,
  auditCard,
  auditIconBtn,
  auditPrimaryBtn,
  AuditSpinner,
  auditToolbar,
  AuditStagger,
  AuditStaggerItem,
  AuditValidationBanner,
  CourseLogActionBadge,
  CourseLogMetadataPreview,
  CourseStatusBadge,
  formatActionLabel,
  formatAuditDate,
  formatAuditRelative,
  NullPlaceholder,
} from "./course-audit-ui";

const ACTION_OPTIONS: { value: CourseLogAction | ""; label: string }[] = [
  { value: "", label: "All Actions" },
  ...COURSE_LOG_ACTIONS.map((action) => ({
    value: action,
    label: formatActionLabel(action),
  })),
];

type Props = {
  onViewLog: (logId: number) => void;
};

export function AdminCourseLogsList({ onViewLog }: Props) {
  const [page, setPage] = useState(DEFAULT_ADMIN_COURSE_LOGS_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [action, setAction] = useState<CourseLogAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adminId, setAdminId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseFilterLabel, setCourseFilterLabel] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const lastToastErrorRef = useRef("");

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      action ||
      startDate ||
      endDate ||
      adminId.trim() ||
      courseId.trim(),
  );

  const activeFilterCount = [
    searchInput.trim(),
    action,
    startDate,
    endDate,
    adminId.trim(),
    courseId.trim(),
  ].filter(Boolean).length;

  const filters = useMemo(
    () => ({
      page,
      limit: DEFAULT_ADMIN_COURSE_LOGS_LIMIT,
      search: searchInput.trim() || undefined,
      action: action || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      admin_id: adminId.trim() || undefined,
      course_id: courseId.trim() || undefined,
    }),
    [page, searchInput, action, startDate, endDate, adminId, courseId],
  );

  const {
    data: logs,
    meta,
    isInitialLoading,
    isRefreshing,
    isEmpty,
    error,
    validationErrors,
    refetch,
  } = useAdminCourseLogs(filters);

  useEffect(() => {
    if (!error) {
      lastToastErrorRef.current = "";
      return;
    }
    if (error === lastToastErrorRef.current) return;
    lastToastErrorRef.current = error;
    adminToastError(error);
  }, [error]);

  const clearFilters = () => {
    setSearchInput("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setAdminId("");
    setCourseId("");
    setCourseFilterLabel("");
    setPage(1);
  };

  const totalLabel = meta?.total ?? logs.length;
  const showErrorPanel = Boolean(error) && !isInitialLoading && logs.length === 0;

  return (
    <AuditFadeIn>
      <AuditSlideUp>
        <div className={`relative ${auditCard}`}>
          <AuditRefreshingBar visible={isRefreshing && !isInitialLoading} />

          {/* Toolbar header */}
          <div className={auditToolbar}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-admin-primary">
                  Module 8 · Read-only
                </p>
                <h2 className="text-lg font-bold tracking-tight text-admin-fg sm:text-xl">
                  Course audit trail
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-admin-muted-foreground">
                  {isInitialLoading ? (
                    "Loading events…"
                  ) : (
                    <>
                      <span className="font-semibold text-admin-fg">{totalLabel}</span> logged
                      events
                      {hasActiveFilters && (
                        <span className="text-admin-primary"> · filtered</span>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <AuditMotionButton
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={auditPrimaryBtn}
                  aria-expanded={filtersOpen}
                  aria-controls="course-log-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-admin-primary px-1.5 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </AuditMotionButton>
                <AuditMotionButton
                  type="button"
                  onClick={() => refetch()}
                  disabled={isInitialLoading || isRefreshing}
                  className={auditPrimaryBtn}
                  aria-label="Refresh course logs"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  <span className="hidden sm:inline">
                    {isRefreshing ? "Refreshing…" : "Refresh"}
                  </span>
                </AuditMotionButton>
              </div>
            </div>

            {/* Filters panel */}
            <div
              id="course-log-filters"
              className={`grid transition-all duration-300 ${filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 rounded-xl border border-admin-border/80 bg-admin-card/60 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <AuditSearchInput
                      value={searchInput}
                      onChange={(value) => {
                        setSearchInput(value);
                        setPage(1);
                      }}
                    />
                    <AuditActionSelect
                      value={action}
                      onChange={(value) => {
                        setAction(value);
                        setPage(1);
                      }}
                      options={ACTION_OPTIONS}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <AuditField label="From date" htmlFor="course-log-start-date">
                      <input
                        id="course-log-start-date"
                        type="date"
                        className={auditFieldInput}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setPage(1);
                        }}
                      />
                    </AuditField>
                    <AuditField label="To date" htmlFor="course-log-end-date">
                      <input
                        id="course-log-end-date"
                        type="date"
                        className={auditFieldInput}
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setPage(1);
                        }}
                      />
                    </AuditField>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <AuditField label="Admin ID (UUID)" htmlFor="course-log-admin-id">
                      <input
                        id="course-log-admin-id"
                        type="text"
                        className={auditFieldInput}
                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                        value={adminId}
                        onChange={(e) => {
                          setAdminId(e.target.value);
                          setPage(1);
                        }}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </AuditField>
                    <AuditCoursePicker
                      value={courseId}
                      onChange={(id, course) => {
                        setCourseId(id);
                        setCourseFilterLabel(course?.title ?? "");
                        setPage(1);
                      }}
                    />
                  </div>

                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-admin-border/60 pt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-admin-muted-foreground">
                        Active:
                      </span>
                      {searchInput.trim() && (
                        <FilterChip label={`Search: ${searchInput.trim()}`} onRemove={() => { setSearchInput(""); setPage(1); }} />
                      )}
                      {action && (
                        <FilterChip
                          label={formatActionLabel(action)}
                          onRemove={() => { setAction(""); setPage(1); }}
                        />
                      )}
                      {startDate && (
                        <FilterChip label={`From ${startDate}`} onRemove={() => { setStartDate(""); setPage(1); }} />
                      )}
                      {endDate && (
                        <FilterChip label={`To ${endDate}`} onRemove={() => { setEndDate(""); setPage(1); }} />
                      )}
                      {courseId && (
                        <FilterChip
                          label={courseFilterLabel ? `Course: ${courseFilterLabel}` : `Course ID`}
                          onRemove={() => {
                            setCourseId("");
                            setCourseFilterLabel("");
                            setPage(1);
                          }}
                        />
                      )}
                      <AuditMotionButton
                        type="button"
                        onClick={clearFilters}
                        className={`${auditPrimaryBtn} ml-auto border-dashed text-xs`}
                      >
                        <FilterX className="h-3.5 w-3.5" />
                        Reset all
                      </AuditMotionButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AuditValidationBanner errors={validationErrors} />

          {isInitialLoading ? (
            <AuditListSkeleton rows={7} />
          ) : showErrorPanel ? (
            <AuditErrorState message={error} onRetry={() => refetch()} />
          ) : logs.length === 0 ? (
            <AuditEmptyState
              icon={BookOpen}
              title={isEmpty ? "No course audit events yet" : "No matching logs"}
              description={
                isEmpty
                  ? "When admins create, update, or publish courses, events will appear here automatically."
                  : "Try broadening your search, action filter, or date range."
              }
              action={
                hasActiveFilters ? (
                  <AuditMotionButton
                    type="button"
                    onClick={clearFilters}
                    className={auditPrimaryBtn}
                  >
                    <FilterX className="h-4 w-4" />
                    Reset filters
                  </AuditMotionButton>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="relative z-0 hidden overflow-x-auto custom-scrollbar lg:block">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-bg/60">
                      {[
                        "Timestamp",
                        "Action",
                        "Admin",
                        "Course",
                        "Context",
                        "IP",
                        "View",
                      ].map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-admin-muted-foreground first:pl-6 last:pr-6"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <CourseLogTableRow
                        key={log.id}
                        log={log}
                        onView={() => onViewLog(log.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <AuditStagger className="relative z-0 divide-y divide-admin-border lg:hidden">
                {logs.map((log) => (
                  <AuditStaggerItem key={log.id}>
                    <CourseLogCard log={log} onView={() => onViewLog(log.id)} />
                  </AuditStaggerItem>
                ))}
              </AuditStagger>
            </>
          )}

          {meta && meta.total > 0 && !showErrorPanel && (
            <div className="border-t border-admin-border bg-admin-bg/40 px-4 sm:px-6">
              <NotificationPagination
                meta={meta}
                loading={isRefreshing}
                page={page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </AuditSlideUp>
    </AuditFadeIn>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-full border border-admin-border bg-admin-bg px-2.5 py-1 text-[11px] font-medium text-admin-fg transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600"
      aria-label={`Remove filter ${label}`}
    >
      {label}
      <FilterX className="h-3 w-3 shrink-0" aria-hidden />
    </button>
  );
}

function CourseLogTableRow({
  log,
  onView,
}: {
  log: AdminCourseLogListItem;
  onView: () => void;
}) {
  return (
    <tr className="group border-b border-admin-border/70 transition-colors duration-200 last:border-0 hover:bg-admin-primary/3 focus-within:bg-admin-primary/3">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-start gap-2">
          <CalendarRange
            className="mt-0.5 h-4 w-4 shrink-0 text-admin-primary/70"
            aria-hidden
          />
          <div>
            <time
              dateTime={log.created_at}
              className="block text-sm font-medium text-admin-fg"
              title={formatAuditDate(log.created_at)}
            >
              {formatAuditDate(log.created_at)}
            </time>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-admin-muted-foreground">
              <Hash className="h-3 w-3" aria-hidden />
              {log.id}
              {formatAuditRelative(log.created_at) && (
                <span>· {formatAuditRelative(log.created_at)}</span>
              )}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <CourseLogActionBadge action={log.action} />
      </td>
      <td className="max-w-[180px] px-5 py-4">
        {log.admin ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-admin-fg" title={log.admin.name}>
              {log.admin.name}
            </p>
            <p
              className="truncate text-xs text-admin-muted-foreground"
              title={log.admin.email}
            >
              {log.admin.email}
            </p>
          </div>
        ) : (
          <NullPlaceholder>Admin removed</NullPlaceholder>
        )}
      </td>
      <td className="max-w-[200px] px-5 py-4">
        {log.course ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-admin-fg" title={log.course.title}>
              {log.course.title}
            </p>
            <div className="mt-1.5">
              <CourseStatusBadge status={log.course.status} />
            </div>
          </div>
        ) : (
          <NullPlaceholder>Course deleted</NullPlaceholder>
        )}
      </td>
      <td className="max-w-[220px] px-5 py-4">
        <CourseLogMetadataPreview metadata={log.metadata} action={log.action} />
      </td>
      <td className="px-5 py-4">
        {log.ip_address ? (
          <span className="font-mono text-xs text-admin-muted-foreground" title={log.ip_address}>
            {log.ip_address}
          </span>
        ) : (
          <NullPlaceholder>No IP captured</NullPlaceholder>
        )}
      </td>
      <td className="px-6 py-4">
        <AuditMotionButton
          type="button"
          onClick={onView}
          className={`${auditIconBtn} opacity-70 group-hover:opacity-100`}
          title={`View details for log ${log.id}`}
          aria-label={`View details for log ${log.id}`}
        >
          <Eye className="h-4 w-4" />
        </AuditMotionButton>
      </td>
    </tr>
  );
}

function CourseLogCard({
  log,
  onView,
}: {
  log: AdminCourseLogListItem;
  onView: () => void;
}) {
  return (
    <article className="px-4 py-4 transition-colors active:bg-admin-muted/5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CourseLogActionBadge action={log.action} />
            <span className="font-mono text-[10px] text-admin-muted-foreground">#{log.id}</span>
          </div>

          <time
            dateTime={log.created_at}
            className="block text-xs text-admin-muted-foreground"
          >
            {formatAuditDate(log.created_at)}
            {formatAuditRelative(log.created_at) && ` · ${formatAuditRelative(log.created_at)}`}
          </time>

          <div className="space-y-2 rounded-lg border border-admin-border/60 bg-admin-bg/30 p-3">
            <p className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 shrink-0 text-admin-primary" aria-hidden />
              {log.admin ? (
                <span className="truncate font-medium text-admin-fg">{log.admin.name}</span>
              ) : (
                <NullPlaceholder>Admin removed</NullPlaceholder>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-admin-primary" aria-hidden />
              {log.course ? (
                <span className="truncate text-admin-fg">{log.course.title}</span>
              ) : (
                <NullPlaceholder>Course deleted</NullPlaceholder>
              )}
            </p>
          </div>

          <CourseLogMetadataPreview metadata={log.metadata} action={log.action} />

          <p className="flex items-center gap-2 text-xs text-admin-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {log.ip_address ?? "No IP captured"}
          </p>
        </div>

        <AuditMotionButton
          type="button"
          onClick={onView}
          className={auditIconBtn}
          aria-label={`View details for log ${log.id}`}
        >
          <Eye className="h-4 w-4" />
        </AuditMotionButton>
      </div>
    </article>
  );
}
