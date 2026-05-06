"use client";

import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animation/animations";
import CoursePageShell from "./CoursePageShell";
import { useGetCourseEntry } from "@/hooks/studentCourses";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <p className="text-sm text-muted">{label}</p>
      <div className="text-sm font-medium text-foreground text-right">{value}</div>
    </div>
  );
}

function NextStepAction({ courseId, nextStep }: { courseId: string; nextStep: string | null }) {
  if (!nextStep) return null;

  if (nextStep === "ENROLL") {
    return (
      <Link className="btn btn-primary" href={`/courses/${courseId}/enroll`}>
        Enroll
      </Link>
    );
  }
  if (nextStep === "START" || nextStep === "RESUME") {
    return (
      <Link className="btn btn-primary" href={`/courses/${courseId}/exam`}>
        {nextStep === "RESUME" ? "Resume exam" : "Start exam"}
      </Link>
    );
  }
  if (nextStep === "RESULT") {
    return (
      <Link className="btn btn-primary" href={`/courses/${courseId}/result`}>
        View result
      </Link>
    );
  }

  return null;
}

export default function CourseEntryView({ courseId }: { courseId: string }) {
  const { course, enrollment, attempt, nextStep, loading, error, refetch } = useGetCourseEntry(courseId);

  const title = course?.title ?? `Course ${courseId}`;
  const subtitle = loading ? "Loading course entry…" : error ? error : "Course entry loaded.";

  return (
    <CoursePageShell
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={refetch} disabled={loading}>
            Refetch
          </button>
          <NextStepAction courseId={courseId} nextStep={nextStep} />
        </>
      }
    >
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <motion.div variants={slideUp} className="space-y-2">
            <InfoRow label="Course ID" value={courseId} />
            <InfoRow label="Enrolled" value={enrollment?.isEnrolled ? <span className="badge-success">Yes</span> : <span className="badge-muted">No</span>} />
            <InfoRow label="Next step" value={<span className="badge-admin-accent">{nextStep ?? "—"}</span>} />
          </motion.div>

          <motion.div variants={slideUp} className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Attempt</p>
            {attempt ? (
              <div className="space-y-2">
                <InfoRow label="Status" value={<span className="badge-admin-accent">{attempt.status}</span>} />
                <InfoRow label="Attempt no." value={attempt.attemptNo} />
                <InfoRow label="Remaining attempts" value={attempt.remainingAttempts} />
                <InfoRow label="Passed" value={attempt.passed === null ? "—" : attempt.passed ? <span className="badge-success">Yes</span> : <span className="badge-error">No</span>} />
                <InfoRow label="Cooldown active" value={attempt.cooldownActive ? <span className="badge-error">Yes</span> : <span className="badge-success">No</span>} />
                <InfoRow label="Cooldown until" value={attempt.cooldownUntil ?? "—"} />
              </div>
            ) : (
              <p className="text-sm text-muted">No attempt started yet.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </CoursePageShell>
  );
}

