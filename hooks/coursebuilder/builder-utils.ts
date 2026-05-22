/** True when API returned a real saved section (not null / empty object). */

export function hasEnrollmentForm(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const fields = (data as { fields?: unknown[] }).fields;
  return Array.isArray(fields) && fields.length > 0;
}

export function hasQuiz(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const questions = (data as { questions?: unknown[] }).questions;
  return Array.isArray(questions) && questions.length > 0;
}

export function hasExamSettings(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  return typeof (data as { duration_minutes?: unknown }).duration_minutes === "number";
}

export function hasCertificate(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as { templateUrl?: string; template_url?: string };
  const url = d.templateUrl ?? d.template_url;
  return typeof url === "string" && url.trim().length > 0;
}

export function getMaxBuilderStep(drafts: {
  basicInfo?: unknown;
  enrollmentForm?: unknown;
  quiz?: unknown;
  examSettings?: unknown;
  certificate?: unknown;
}): number {
  if (!drafts.basicInfo) return 1;
  if (!hasEnrollmentForm(drafts.enrollmentForm)) return 2;
  if (!hasQuiz(drafts.quiz)) return 3;
  if (!hasExamSettings(drafts.examSettings)) return 4;
  if (!hasCertificate(drafts.certificate)) return 5;
  return 6;
}
