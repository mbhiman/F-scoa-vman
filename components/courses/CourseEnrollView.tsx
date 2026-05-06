"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animation/animations";
import CoursePageShell from "./CoursePageShell";
import { useGetEnrollmentForm, useSubmitEnrollment } from "@/hooks/studentCourses";
import type { EnrollmentField, EnrollmentGroup } from "@/hooks/studentCourses/useGetEnrollmentForm";

function buildInitialAnswers(groups: EnrollmentGroup[], ungroupedFields: EnrollmentField[]) {
  const allFields = [...groups.flatMap((g) => g.fields), ...ungroupedFields];
  const init: Record<string, unknown> = {};
  allFields.forEach((f) => {
    if (f.type === "checkbox") init[f.fieldKey] = false;
    else init[f.fieldKey] = "";
  });
  return init;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: EnrollmentField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const commonLabel = (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-foreground">
        {field.label} {field.required ? <span className="text-red-500">*</span> : null}
      </label>
      <span className="text-xs text-muted">{field.type}</span>
    </div>
  );

  if (field.type === "select" || field.type === "radio") {
    const options = Array.isArray(field.config?.options) ? field.config?.options : [];
    return (
      <div className="space-y-2">
        {commonLabel}
        {field.type === "select" ? (
          <select
            className="input-field"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={`${o.value}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-2">
            {options.map((o) => (
              <label key={`${o.value}`} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={field.fieldKey}
                  checked={value === o.value}
                  onChange={() => onChange(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
        <span className="text-sm font-medium text-foreground">
          {field.label} {field.required ? <span className="text-red-500">*</span> : null}
        </span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border border-border bg-background"
        />
      </label>
    );
  }

  const inputType =
    field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "date" ? "date" : "text";

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <textarea
          className="input-field min-h-28 resize-y"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={typeof field.config?.placeholder === "string" ? field.config.placeholder : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commonLabel}
      <input
        className="input-field"
        type={inputType}
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        placeholder={typeof field.config?.placeholder === "string" ? field.config.placeholder : undefined}
      />
    </div>
  );
}

export default function CourseEnrollView({ courseId }: { courseId: string }) {
  const formState = useGetEnrollmentForm(courseId);
  const submitState = useSubmitEnrollment(courseId);

  const initialAnswers = useMemo(() => buildInitialAnswers(formState.groups, formState.ungroupedFields), [
    formState.groups,
    formState.ungroupedFields,
  ]);

  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);

  // Keep answers shape in sync when the form loads/changes.
  React.useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const title = formState.form?.name ?? "Course enrollment";
  const subtitle = formState.loading
    ? "Loading enrollment form…"
    : formState.alreadyEnrolled
      ? "You are already enrolled in this course."
      : formState.error
        ? formState.error
        : "Fill the form to enroll.";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitState.submit(answers);
  };

  return (
    <CoursePageShell
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={formState.refetch} disabled={formState.loading}>
            Refetch
          </button>
          <Link className="btn btn-primary" href={`/courses/${courseId}`}>
            Back
          </Link>
        </>
      }
    >
      {formState.alreadyEnrolled ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">Nothing to do here — enrollment already exists.</p>
          <Link className="btn btn-primary" href={`/courses/${courseId}/exam`}>
            Go to exam
          </Link>
        </div>
      ) : formState.error ? (
        <div className="text-sm text-red-500">{formState.error}</div>
      ) : (
        <motion.form
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          onSubmit={onSubmit}
          className="space-y-6"
        >
          {submitState.error ? <div className="text-sm text-red-500">{submitState.error}</div> : null}
          {submitState.success ? (
            <div className="rounded-xl border border-border bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              Enrollment submitted successfully.
            </div>
          ) : null}

          {submitState.validationErrors.length > 0 ? (
            <div className="rounded-xl border border-border bg-red-500/10 px-4 py-3 text-sm text-red-600">
              <p className="font-medium">Validation errors</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {submitState.validationErrors.map((v, idx) => (
                  <li key={`${v.field}-${idx}`}>
                    <span className="font-medium">{v.field}</span>: {v.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {formState.groups.map((group) => (
            <motion.section key={group.id} variants={slideUp} className="space-y-4">
              <div className="border-b border-border pb-2">
                <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <FieldControl
                      field={field}
                      value={answers[field.fieldKey]}
                      onChange={(next) => setAnswers((prev) => ({ ...prev, [field.fieldKey]: next }))}
                    />
                  </div>
                ))}
              </div>
            </motion.section>
          ))}

          {formState.ungroupedFields.length > 0 ? (
            <motion.section variants={slideUp} className="space-y-4">
              <div className="border-b border-border pb-2">
                <h2 className="text-lg font-semibold text-foreground">Other</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {formState.ungroupedFields.map((field) => (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <FieldControl
                      field={field}
                      value={answers[field.fieldKey]}
                      onChange={(next) => setAnswers((prev) => ({ ...prev, [field.fieldKey]: next }))}
                    />
                  </div>
                ))}
              </div>
            </motion.section>
          ) : null}

          <motion.div variants={slideUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              Course ID: <span className="font-mono">{courseId}</span>
            </p>
            <button type="submit" className="btn btn-primary" disabled={submitState.loading || formState.loading}>
              {submitState.loading ? "Submitting…" : "Submit enrollment"}
            </button>
          </motion.div>
        </motion.form>
      )}
    </CoursePageShell>
  );
}

