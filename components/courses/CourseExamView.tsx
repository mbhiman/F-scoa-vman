"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animation/animations";
import CoursePageShell from "./CoursePageShell";
import { useGetExam, useStartExam, useSubmitExam } from "@/hooks/studentCourses";

type SelectionMap = Record<string, string | null>;

function buildInitialSelections(questions: { id: string }[]) {
  const init: SelectionMap = {};
  questions.forEach((q) => {
    init[q.id] = null;
  });
  return init;
}

export default function CourseExamView({ courseId }: { courseId: string }) {
  const startExam = useStartExam(courseId);
  const exam = useGetExam(courseId);
  const submitExam = useSubmitExam(courseId);

  const [selections, setSelections] = useState<SelectionMap>({});

  React.useEffect(() => {
    if (exam.questions.length === 0) return;
    setSelections((prev) => ({ ...buildInitialSelections(exam.questions), ...prev }));
  }, [exam.questions]);

  const answersPayload = useMemo(() => {
    return Object.entries(selections)
      .filter(([, opt]) => typeof opt === "string" && opt.length > 0)
      .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId: selectedOptionId as string }));
  }, [selections]);

  const title = "Exam";
  const errorMessage = exam.error ?? startExam.error ?? submitExam.error;
  const subtitle = exam.loading
    ? "Loading exam…"
    : startExam.loading
      ? "Starting exam…"
      : errorMessage
        ? errorMessage
        : "Start the exam, pick options, submit when ready.";

  const canSubmit = exam.questions.length > 0 && !submitExam.loading && !startExam.loading;

  return (
    <CoursePageShell
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={startExam.start} disabled={startExam.loading}>
            {startExam.loading ? "Starting…" : "Start / Resume"}
          </button>
          <Link className="btn btn-primary" href={`/courses/${courseId}`}>
            Back
          </Link>
        </>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
        {(startExam.cooldownActive || startExam.maxAttemptsReached || startExam.alreadyPassed) && (
          <motion.div variants={slideUp} className="rounded-xl border border-border bg-red-500/10 px-4 py-3 text-sm">
            {startExam.alreadyPassed ? (
              <p className="text-red-600">You have already passed this exam.</p>
            ) : null}
            {startExam.maxAttemptsReached ? (
              <p className="text-red-600">Maximum attempts reached.</p>
            ) : null}
            {startExam.cooldownActive ? (
              <p className="text-red-600">
                Cooldown active. Try again later.{" "}
                {startExam.cooldownUntil ? <span className="font-mono">{startExam.cooldownUntil}</span> : null}
              </p>
            ) : null}
          </motion.div>
        )}

        {exam.attemptExpired || exam.examNotStarted || exam.noActiveAttempt || exam.alreadyCompleted ? (
          <motion.div variants={slideUp} className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm">
            {exam.attemptExpired ? <p className="text-muted">Attempt expired. Start again to create a new attempt.</p> : null}
            {exam.examNotStarted ? <p className="text-muted">Exam not started. Click “Start / Resume”.</p> : null}
            {exam.noActiveAttempt ? <p className="text-muted">No active attempt. Click “Start / Resume”.</p> : null}
            {exam.alreadyCompleted ? (
              <p className="text-muted">
                Exam already completed.{" "}
                <Link className="underline" href={`/courses/${courseId}/result`}>
                  View result
                </Link>
              </p>
            ) : null}
          </motion.div>
        ) : null}

        {submitExam.result ? (
          <motion.div
            variants={slideUp}
            className="rounded-xl border border-border bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium">
                Submitted. Score: <span className="font-mono">{submitExam.result.score}</span> —{" "}
                {submitExam.result.passed ? "Passed" : "Failed"}
              </p>
              <Link className="btn btn-primary" href={`/courses/${courseId}/result`}>
                View result
              </Link>
            </div>
          </motion.div>
        ) : null}

        {exam.questions.length === 0 ? (
          <motion.div variants={slideUp} className="text-sm text-muted">
            No questions loaded yet. Start/resume the exam, then refetch if needed.
          </motion.div>
        ) : (
          <motion.div variants={slideUp} className="space-y-4">
            {exam.questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {idx + 1}. {q.questionText}
                  </p>
                  <span className="badge-muted">#{q.sortOrder}</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name={q.id}
                        checked={selections[q.id] === o.id}
                        onChange={() => setSelections((prev) => ({ ...prev, [q.id]: o.id }))}
                      />
                      <span>{o.optionText}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {submitExam.validationErrors.length > 0 ? (
              <div className="rounded-xl border border-border bg-red-500/10 px-4 py-3 text-sm text-red-600">
                <p className="font-medium">Validation errors</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {submitExam.validationErrors.map((v, idx) => (
                    <li key={`${v.field}-${idx}`}>
                      <span className="font-medium">{v.field}</span>: {v.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {submitExam.attemptExpired ? (
              <div className="rounded-xl border border-border bg-red-500/10 px-4 py-3 text-sm text-red-600">
                Attempt expired. Start a new attempt and submit again.
              </div>
            ) : null}
            {submitExam.alreadySubmitted ? (
              <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm text-muted">
                Exam already submitted.{" "}
                <Link className="underline" href={`/courses/${courseId}/result`}>
                  View result
                </Link>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Selected:{" "}
                <span className="font-mono">
                  {answersPayload.length}/{exam.questions.length}
                </span>
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={() => submitExam.submit(answersPayload)}
              >
                {submitExam.loading ? "Submitting…" : "Submit exam"}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </CoursePageShell>
  );
}

