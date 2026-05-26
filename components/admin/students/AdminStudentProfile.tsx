"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { adminToastError } from "@/lib/admin-toast";
import { buttonHover, buttonTap, staggerContainer } from "@/lib/animation/animations";
import { useAdminStudentDetails } from "@/hooks/admin/students";
import type { AdminStudentCourse } from "@/hooks/admin/students";
import {
  ADMIN_LEARNERS_BASE_PATH,
  AttemptStatusBadge,
  CourseEnrollmentStatusBadge,
  formatAdminDate,
  formatGender,
  LearnerAvatar,
  LearnerEmptyState,
  LearnerErrorState,
  LearnerFadeIn,
  learnerCard,
  learnerGhostLink,
  learnerPageHeader,
  learnerPrimaryBtn,
  learnerShell,
  LearnerProfileSkeleton,
  LearnerRefreshingBar,
  LearnerSlideUp,
  LearnerStagger,
  LearnerStaggerItem,
  StudentStatusBadge,
} from "./student-ui";

type Props = {
  studentId: string;
  basePath?: string;
};

export function AdminStudentProfile({
  studentId,
  basePath = ADMIN_LEARNERS_BASE_PATH,
}: Props) {
  const lastToastErrorRef = useRef("");
  const {
    data,
    isInitialLoading,
    loading,
    error,
    validationErrors,
    refetch,
  } = useAdminStudentDetails(studentId);

  useEffect(() => {
    if (!error) {
      lastToastErrorRef.current = "";
      return;
    }
    if (error === lastToastErrorRef.current) return;
    lastToastErrorRef.current = error;
    adminToastError(error);
  }, [error]);

  if (isInitialLoading) {
    return <LearnerProfileSkeleton />;
  }

  if (!data) {
    return (
      <LearnerFadeIn className={learnerShell}>
        <Link href={basePath} className={learnerGhostLink}>
          <ArrowLeft className="h-4 w-4" />
          Back to learners
        </Link>
        <div className={`relative ${learnerCard}`}>
          <LearnerErrorState
            title="Learner not found"
            message={error ?? "This profile could not be loaded."}
            onRetry={() => refetch()}
          />
        </div>
      </LearnerFadeIn>
    );
  }

  const stats = [
    { label: "Enrolled", value: data.courses_enrolled_count, accent: "text-admin-primary" },
    { label: "Quiz attempts", value: data.quiz_attempts_count, accent: "text-admin-fg" },
    { label: "Passed", value: data.passed_courses_count, accent: "text-emerald-600" },
    { label: "Failed", value: data.failed_courses_count, accent: "text-red-500" },
    { label: "In progress", value: data.in_progress_courses_count, accent: "text-amber-600" },
  ];

  return (
    <LearnerFadeIn className={learnerShell}>
      <div className={learnerPageHeader}>
        <Link href={basePath} className={`${learnerGhostLink} -ml-2`}>
          <ArrowLeft className="h-4 w-4" />
          Back to learners
        </Link>
        <motion.button
          type="button"
          whileHover={buttonHover}
          whileTap={buttonTap}
          onClick={() => refetch()}
          disabled={loading}
          className={`${learnerPrimaryBtn} w-full sm:w-auto`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing…" : "Refresh"}
        </motion.button>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:px-5">
          <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
            {validationErrors.map((e) => (
              <li key={`${e.field}-${e.message}`}>
                <span className="font-semibold">{e.field}:</span> {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <LearnerSlideUp>
        <div className={`relative ${learnerCard} p-5 sm:p-8`}>
          <LearnerRefreshingBar visible={loading && !isInitialLoading} />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <LearnerAvatar name={data.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-admin-primary">
                    Learner profile
                  </p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-admin-fg sm:text-2xl">
                    {data.name}
                  </h1>
                  <p className="mt-1 break-all font-mono text-xs text-admin-muted-foreground">
                    {data.id}
                  </p>
                </div>
                <StudentStatusBadge status={data.status} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ContactChip
                  icon={Phone}
                  label="Mobile"
                  value={data.mobile}
                  verified={data.mobile_verified}
                />
                <ContactChip
                  icon={Mail}
                  label="Email"
                  value={data.email ?? "No email on file"}
                  verified={Boolean(data.email_verified && data.email)}
                />
                <ContactChip
                  icon={Calendar}
                  label="Date of birth"
                  value={`${formatAdminDate(data.date_of_birth)} · ${data.age} yrs · ${formatGender(data.gender)}`}
                  className="sm:col-span-2"
                />
              </div>

              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-admin-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-admin-primary" />
                <span>Joined {formatAdminDate(data.created_at)}</span>
                {data.latest_login_at && (
                  <>
                    <span className="hidden text-admin-border sm:inline">·</span>
                    <span>Last login {formatAdminDate(data.latest_login_at)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </LearnerSlideUp>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {stats.map((item) => (
          <LearnerStaggerItem key={item.label}>
            <div
              className={`${learnerCard} px-4 py-4 text-center transition-transform duration-200 hover:-translate-y-0.5 sm:py-5`}
            >
              <p className={`text-2xl font-bold tabular-nums sm:text-3xl ${item.accent}`}>
                {item.value}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-admin-muted-foreground sm:text-[11px]">
                {item.label}
              </p>
            </div>
          </LearnerStaggerItem>
        ))}
      </motion.div>

      <LearnerSlideUp delay={0.08}>
        <section className={`relative ${learnerCard}`}>
          <LearnerRefreshingBar visible={loading && !isInitialLoading} />

          <div className="flex flex-wrap items-center gap-2 border-b border-admin-border px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-admin-primary/10 text-admin-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-admin-fg sm:text-base">Enrolled courses</h2>
              <p className="text-xs text-admin-muted-foreground">Progress and attempt history</p>
            </div>
            <span className="badge-muted ml-auto px-2.5 py-1">{data.courses.length} total</span>
          </div>

          {data.courses.length === 0 ? (
            <LearnerEmptyState
              icon={BookOpen}
              title="No enrollments yet"
              description="This learner has not enrolled in any courses."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto custom-scrollbar md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-bg/50">
                      {[
                        "Course",
                        "Type",
                        "Status",
                        "Latest attempt",
                        "Attempts",
                        "Last activity",
                      ].map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-admin-muted-foreground first:pl-6 last:pr-6"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((course) => (
                      <CourseTableRow key={course.course_id} course={course} />
                    ))}
                  </tbody>
                </table>
              </div>

              <LearnerStagger className="divide-y divide-admin-border md:hidden">
                {data.courses.map((course) => (
                  <LearnerStaggerItem key={course.course_id}>
                    <CourseCard course={course} />
                  </LearnerStaggerItem>
                ))}
              </LearnerStagger>
            </>
          )}
        </section>
      </LearnerSlideUp>
    </LearnerFadeIn>
  );
}

function ContactChip({
  icon: Icon,
  label,
  value,
  verified,
  className = "",
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  verified?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-admin-border/80 bg-admin-bg/50 px-3.5 py-3 transition-colors duration-200 hover:border-admin-primary/25 hover:bg-admin-primary/2 ${className}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-primary/10 text-admin-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-admin-fg">
          <span className="wrap-break-word">{value}</span>
          {verified && (
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
              aria-label="Verified"
            />
          )}
        </p>
      </div>
    </div>
  );
}

function CourseTableRow({ course }: { course: AdminStudentCourse }) {
  return (
    <tr className="group border-b border-admin-border/80 transition-colors duration-200 last:border-0 hover:bg-admin-primary/3">
      <td className="px-6 py-4">
        <p className="font-semibold text-admin-fg transition-colors group-hover:text-admin-primary">
          {course.course_title}
        </p>
        <p className="mt-0.5 text-[11px] text-admin-muted-foreground">
          Enrolled {formatAdminDate(course.enrolled_at)}
        </p>
      </td>
      <td className="px-5 py-4">
        {course.is_ncvet ? (
          <span className="badge-admin-accent px-2.5 py-1">NCVET</span>
        ) : (
          <span className="badge-muted px-2.5 py-1">Standard</span>
        )}
      </td>
      <td className="px-5 py-4">
        <CourseStatusCell course={course} />
      </td>
      <td className="px-5 py-4">
        <AttemptStatusBadge status={course.latest_attempt_status} />
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-admin-muted/10 px-2 text-sm font-semibold tabular-nums text-admin-fg">
          {course.attempts_count}
        </span>
      </td>
      <td className="px-6 py-4 text-admin-muted-foreground">
        {formatAdminDate(course.last_attempted_at)}
      </td>
    </tr>
  );
}

function CourseCard({ course }: { course: AdminStudentCourse }) {
  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-admin-fg">{course.course_title}</p>
          <p className="mt-0.5 text-[11px] text-admin-muted-foreground">
            Enrolled {formatAdminDate(course.enrolled_at)}
          </p>
        </div>
        {course.is_ncvet ? (
          <span className="badge-admin-accent shrink-0 px-2 py-0.5">NCVET</span>
        ) : (
          <span className="badge-muted shrink-0 px-2 py-0.5">Standard</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CourseStatusCell course={course} />
        <AttemptStatusBadge status={course.latest_attempt_status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-admin-muted-foreground">
        <span>
          <span className="font-semibold text-admin-fg">{course.attempts_count}</span> attempts
        </span>
        <span>Last {formatAdminDate(course.last_attempted_at)}</span>
      </div>
    </article>
  );
}

function CourseStatusCell({ course }: { course: AdminStudentCourse }) {
  return <CourseEnrollmentStatusBadge course={course} />;
}
