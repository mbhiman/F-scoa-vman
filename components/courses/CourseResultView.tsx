"use client";

import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animation/animations";
import CoursePageShell from "./CoursePageShell";
import { useGetExamResult } from "@/hooks/studentCourses";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function CourseResultView({ courseId }: { courseId: string }) {
  const { attempt, questions, notSubmittedYet, examNotStarted, loading, error, refetch } = useGetExamResult(courseId);

  const title = "Result";
  const subtitle = loading
    ? "Loading result…"
    : error
      ? error
      : notSubmittedYet
        ? "Exam not submitted yet."
        : examNotStarted
          ? "Exam not started."
          : "Result loaded.";

  return (
    <CoursePageShell
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={refetch} disabled={loading}>
            Refetch
          </button>
          <Link className="btn btn-primary" href={`/courses/${courseId}`}>
            Back
          </Link>
        </>
      }
    >
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : notSubmittedYet || examNotStarted ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {notSubmittedYet ? "Exam not submitted yet." : null}
            {examNotStarted ? "Exam not started." : null}
          </p>
          <Link className="btn btn-primary" href={`/courses/${courseId}/exam`}>
            Go to exam
          </Link>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={slideUp} className="grid gap-3 sm:grid-cols-4">
            <Stat label="Score" value={<span className="font-mono">{attempt?.score ?? "—"}</span>} />
            <Stat label="Passed" value={attempt?.passed ? <span className="badge-success">Yes</span> : <span className="badge-error">No</span>} />
            <Stat
              label="Correct"
              value={
                <span className="font-mono">
                  {attempt?.correctAnswers ?? "—"}/{attempt?.totalQuestions ?? "—"}
                </span>
              }
            />
            <Stat label="Attempt no." value={<span className="font-mono">{attempt?.attemptNo ?? "—"}</span>} />
          </motion.div>

          <motion.div variants={slideUp} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Breakdown</h2>
            {questions.length === 0 ? (
              <p className="text-sm text-muted">No question breakdown available.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.questionId} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {idx + 1}. {q.questionText}
                      </p>
                      <span className={q.isCorrect ? "badge-success" : "badge-error"}>{q.isCorrect ? "Correct" : "Wrong"}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {q.options.map((o) => {
                        const isSelected = q.selectedOptionId === o.optionId;
                        const isCorrect = o.isCorrect;
                        const border =
                          isCorrect && isSelected
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : isCorrect
                              ? "border-emerald-500/40"
                              : isSelected
                                ? "border-red-500/40 bg-red-500/10"
                                : "border-border";
                        return (
                          <div key={o.optionId} className={`rounded-lg border px-3 py-2 text-sm ${border}`}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-foreground">{o.optionText}</span>
                              <div className="flex gap-2">
                                {isSelected ? <span className="badge-admin-accent">Selected</span> : null}
                                {isCorrect ? <span className="badge-success">Correct</span> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </CoursePageShell>
  );
}

