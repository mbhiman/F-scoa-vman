"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  FilterX,
  Mail,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import NotificationPagination from "@/components/notifications/NotificationPagination";
import { adminToastError } from "@/lib/admin-toast";
import { buttonHover, buttonTap } from "@/lib/animation/animations";
import {
  DEFAULT_ADMIN_STUDENTS_LIMIT,
  DEFAULT_ADMIN_STUDENTS_PAGE,
  useAdminStudents,
  type AdminStudentListItem,
  type AdminStudentStatus,
} from "@/hooks/admin/students";
import {
  ADMIN_LEARNERS_BASE_PATH,
  formatGender,
  LearnerAvatar,
  LearnerEmptyState,
  LearnerErrorState,
  LearnerFadeIn,
  LearnerListSkeleton,
  LearnerRefreshingBar,
  LearnerSearchInput,
  LearnerSlideUp,
  learnerCard,
  learnerGhostLink,
  learnerIconBtn,
  learnerPageHeader,
  learnerPrimaryBtn,
  learnerShell,
  learnerToolbar,
  LearnerStatusSelect,
  LearnerStagger,
  LearnerStaggerItem,
  StudentStatusBadge,
} from "./student-ui";

const STATUS_OPTIONS: { value: AdminStudentStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "ABANDONED", label: "Abandoned" },
  { value: "BLOCKED", label: "Blocked" },
];

type AdminStudentsListProps = {
  basePath?: string;
};

export function AdminStudentsList({ basePath = ADMIN_LEARNERS_BASE_PATH }: AdminStudentsListProps) {
  const router = useRouter();
  const [page, setPage] = useState(DEFAULT_ADMIN_STUDENTS_PAGE);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<AdminStudentStatus | "">("");
  const lastToastErrorRef = useRef("");

  const hasActiveFilters = Boolean(searchInput.trim() || status);

  const filters = useMemo(
    () => ({
      page,
      limit: DEFAULT_ADMIN_STUDENTS_LIMIT,
      search: searchInput.trim() || undefined,
      status: status || undefined,
    }),
    [page, searchInput, status],
  );

  const {
    data: students,
    meta,
    isInitialLoading,
    isRefreshing,
    isEmpty,
    error,
    validationErrors,
    refetch,
  } = useAdminStudents(filters);

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
    setStatus("");
    setPage(1);
  };

  const totalLabel = meta?.total ?? students.length;
  const showErrorPanel = Boolean(error) && !isInitialLoading && students.length === 0;

  return (
    <LearnerFadeIn className={learnerShell}>
      <LearnerSlideUp className={learnerPageHeader}>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-admin-primary">
            Module 7 · Learners
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-admin-fg sm:text-3xl">Learners</h1>
          <p className="max-w-xl text-sm leading-relaxed text-admin-muted-foreground">
            Browse enrolled learners, filter by status, and open profiles for course progress.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => refetch()}
          disabled={isInitialLoading || isRefreshing}
          className={`${learnerPrimaryBtn} w-full sm:w-auto`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </motion.button>
      </LearnerSlideUp>

      <LearnerSlideUp delay={0.05}>
        <div className={`relative ${learnerCard}`}>
          <LearnerRefreshingBar visible={isRefreshing && !isInitialLoading} />

          <div className={learnerToolbar}>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-admin-fg">All learners</h2>
              <p className="mt-0.5 text-xs text-admin-muted-foreground">
                {isInitialLoading ? (
                  "Loading directory…"
                ) : (
                  <>
                    <span className="font-medium text-admin-fg">{totalLabel}</span> learners
                    {hasActiveFilters && " · filtered"}
                  </>
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start lg:max-w-2xl lg:flex-1 lg:justify-end">
              <LearnerSearchInput
                value={searchInput}
                onChange={(value) => {
                  setSearchInput(value);
                  setPage(1);
                }}
              />
              <LearnerStatusSelect
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
              />
              {hasActiveFilters && (
                <motion.button
                  type="button"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  onClick={clearFilters}
                  className={`${learnerPrimaryBtn} shrink-0 border-dashed`}
                  aria-label="Clear filters"
                >
                  <FilterX className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </motion.button>
              )}
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:px-6">
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                {validationErrors.map((e) => (
                  <li key={`${e.field}-${e.message}`}>
                    <span className="font-semibold">{e.field}:</span> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isInitialLoading ? (
            <LearnerListSkeleton rows={6} />
          ) : showErrorPanel ? (
            <LearnerErrorState message={error} onRetry={() => refetch()} />
          ) : students.length === 0 ? (
            <LearnerEmptyState
              title={isEmpty ? "No learners yet" : "No learners match your filters"}
              description={
                isEmpty
                  ? "When students enroll, they will appear here."
                  : "Try adjusting your search or status filter."
              }
              action={
                hasActiveFilters ? (
                  <motion.button
                    type="button"
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                    onClick={clearFilters}
                    className={learnerPrimaryBtn}
                  >
                    <FilterX className="h-4 w-4" />
                    Clear filters
                  </motion.button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="relative z-0 hidden overflow-x-auto custom-scrollbar md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-bg/50">
                      {["Learner", "Contact", "Age / Gender", "Status", "Courses", ""].map(
                        (header) => (
                          <th
                            key={header}
                            className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-admin-muted-foreground first:pl-6 last:pr-6"
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <StudentTableRow
                        key={student.id}
                        student={student}
                        onOpen={() => router.push(`${basePath}/${student.id}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <LearnerStagger className="relative z-0 divide-y divide-admin-border md:hidden">
                {students.map((student) => (
                  <LearnerStaggerItem key={student.id}>
                    <StudentCard
                      student={student}
                      onOpen={() => router.push(`${basePath}/${student.id}`)}
                    />
                  </LearnerStaggerItem>
                ))}
              </LearnerStagger>
            </>
          )}

          {meta && meta.total > 0 && !showErrorPanel && (
            <div className="border-t border-admin-border bg-admin-bg/30 px-4 sm:px-6">
              <NotificationPagination
                meta={meta}
                loading={isRefreshing}
                page={page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </LearnerSlideUp>
    </LearnerFadeIn>
  );
}

function StudentTableRow({
  student,
  onOpen,
}: {
  student: AdminStudentListItem;
  onOpen: () => void;
}) {
  return (
    <tr className="group border-b border-admin-border/80 transition-colors duration-200 last:border-0 hover:bg-admin-primary/3">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          <LearnerAvatar name={student.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-admin-fg transition-colors group-hover:text-admin-primary">
              {student.name}
            </p>
            <p className="truncate font-mono text-[11px] text-admin-muted-foreground">
              {student.id.slice(0, 8)}…
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-admin-fg">{student.mobile}</p>
        <p className="max-w-[200px] truncate text-xs text-admin-muted-foreground">
          {student.email ?? "No email"}
        </p>
      </td>
      <td className="px-5 py-4 text-admin-muted-foreground">
        <span className="text-admin-fg">{student.age}</span>
        <span className="text-admin-muted-foreground/60"> · </span>
        {formatGender(student.gender)}
      </td>
      <td className="px-5 py-4">
        <StudentStatusBadge status={student.status} />
      </td>
      <td className="px-5 py-4">
        <span className="badge-admin-accent px-2.5 py-1">
          {student.courses_enrolled_count} enrolled
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end opacity-80 transition-opacity group-hover:opacity-100">
          <RowActionButton onClick={onOpen} label="View profile">
            <Eye className="h-4 w-4" />
          </RowActionButton>
        </div>
      </td>
    </tr>
  );
}

function StudentCard({
  student,
  onOpen,
}: {
  student: AdminStudentListItem;
  onOpen: () => void;
}) {
  return (
    <article className="group px-4 py-4 transition-colors active:bg-admin-muted/5 sm:px-5">
      <div className="flex items-start gap-3.5">
        <LearnerAvatar name={student.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-admin-fg">{student.name}</p>
              <p className="mt-0.5 font-mono text-[10px] text-admin-muted-foreground">
                {student.id.slice(0, 12)}…
              </p>
            </div>
            <StudentStatusBadge status={student.status} />
          </div>

          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 text-admin-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0 text-admin-primary" />
              <span className="text-admin-fg">{student.mobile}</span>
            </p>
            <p className="flex items-center gap-2 text-admin-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0 text-admin-primary" />
              <span className="truncate">{student.email ?? "No email"}</span>
            </p>
            <p className="flex items-center gap-2 text-admin-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0 text-admin-primary" />
              {student.age} yrs · {formatGender(student.gender)}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="badge-admin-accent px-2.5 py-1 text-[11px]">
              {student.courses_enrolled_count} courses
            </span>
            <RowActionButton onClick={onOpen} label="View profile">
              <Eye className="h-4 w-4" />
            </RowActionButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function RowActionButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={buttonHover}
      whileTap={buttonTap}
      onClick={onClick}
      className={learnerIconBtn}
      title={label}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}
