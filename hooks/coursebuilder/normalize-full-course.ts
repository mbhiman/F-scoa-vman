export type CourseDrafts = {
  basicInfo: Record<string, unknown> | null;
  enrollmentForm: Record<string, unknown> | null;
  quiz: Record<string, unknown> | null;
  examSettings: Record<string, unknown> | null;
  certificate: Record<string, unknown> | null;
};
import {
  hasCertificate,
  hasEnrollmentForm,
  hasExamSettings,
  hasQuiz,
} from "./builder-utils";
import { BASE_URL } from "./shared";

type Rec = Record<string, unknown>;

const asRec = (v: unknown): Rec | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null;

const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

/** Pick first present key from API (camelCase or snake_case). */
function pick<T>(obj: Rec | null, keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function toAbsoluteMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizeCourse(raw: unknown): Rec | null {
  const c = asRec(raw);
  if (!c) return null;
  const thumb = str(c.thumbnailUrl ?? c.thumbnail_url);
  return {
    id: str(c.id),
    title: str(c.title),
    description: c.description ?? null,
    status: str(c.status, "DRAFT"),
    is_ncvet: bool(c.is_ncvet ?? c.isNcvet, false),
    thumbnailUrl: thumb ? toAbsoluteMediaUrl(thumb) : null,
  };
}

/** API → builder enrollment payload (flat groups + fields with tempId / groupTempId). */
function normalizeEnrollmentForm(raw: unknown): Rec | null {
  const root = asRec(raw);
  if (!root) return null;

  // Wrapped like student form: { form, groups, ungrouped_fields }
  const wrappedForm = asRec(pick(root, ["form"]));
  const name =
    str(root.name) ||
    str(wrappedForm?.name) ||
    "";

  const apiGroups = asArr(root.groups);
  const ungrouped = asArr(root.ungrouped_fields ?? root.ungroupedFields);

  const builderGroups: Rec[] = [];
  const builderFields: Rec[] = [];

  // Shape A: builder flat — groups + fields already at top level
  const topFields = asArr(root.fields);
  if (topFields.length > 0) {
    const groups = apiGroups.map((g, i) => {
      const gr = asRec(g)!;
      const tempId = str(gr.tempId ?? gr.temp_id ?? gr.id, `grp_${i}`);
      return {
        tempId,
        label: str(gr.label, "Section"),
        sort_order: num(gr.sort_order ?? gr.sortOrder, i),
      };
    });

    topFields.forEach((f, i) => {
      const field = asRec(f);
      if (!field) return;
      builderFields.push({
        field_key: str(field.field_key ?? field.fieldKey),
        label: str(field.label),
        type: str(field.type, "text"),
        required: bool(field.required),
        sort_order: num(field.sort_order ?? field.sortOrder, i),
        groupTempId:
          field.groupTempId ??
          field.group_temp_id ??
          field.groupId ??
          field.group_id ??
          null,
        config: asRec(field.config) ?? {},
      });
    });

    return { name, groups, fields: builderFields };
  }

  // Shape B: nested groups[].fields[] (common from GET /full)
  apiGroups.forEach((g, gi) => {
    const gr = asRec(g);
    if (!gr) return;

    const tempId = str(gr.tempId ?? gr.temp_id ?? gr.id, `grp_${gi}`);
    builderGroups.push({
      tempId,
      label: str(gr.label, "Section"),
      sort_order: num(gr.sort_order ?? gr.sortOrder, gi),
    });

    asArr(gr.fields).forEach((f, fi) => {
      const field = asRec(f);
      if (!field) return;
      builderFields.push({
        field_key: str(field.field_key ?? field.fieldKey),
        label: str(field.label),
        type: str(field.type, "text"),
        required: bool(field.required),
        sort_order: num(field.sort_order ?? field.sortOrder, fi),
        groupTempId: tempId,
        config: asRec(field.config) ?? {},
      });
    });
  });

  ungrouped.forEach((f, i) => {
    const field = asRec(f);
    if (!field) return;
    builderFields.push({
      field_key: str(field.field_key ?? field.fieldKey),
      label: str(field.label),
      type: str(field.type, "text"),
      required: bool(field.required),
      sort_order: num(field.sort_order ?? field.sortOrder, i),
      groupTempId: null,
      config: asRec(field.config) ?? {},
    });
  });

  if (builderFields.length === 0) return null;

  return {
    name,
    groups: builderGroups,
    fields: builderFields,
  };
}

function normalizeQuiz(raw: unknown): Rec | null {
  const q = asRec(raw);
  if (!q) return null;

  const questions = asArr(q.questions).map((question, qi) => {
    const qr = asRec(question)!;
    const options = asArr(qr.options).map((opt, oi) => {
      const or = asRec(opt)!;
      return {
        option_text: str(or.option_text ?? or.optionText ?? or.text),
        is_correct: bool(or.is_correct ?? or.isCorrect),
        sort_order: num(or.sort_order ?? or.sortOrder, oi),
      };
    });

    return {
      question_text: str(qr.question_text ?? qr.questionText),
      sort_order: num(qr.sort_order ?? qr.sortOrder, qi),
      options,
    };
  });

  if (questions.length === 0) return null;

  return {
    title: str(q.title) || null,
    questions,
  };
}

function normalizeExamSettings(raw: unknown): Rec | null {
  const e = asRec(raw);
  if (!e) return null;

  const extra = asRec(e.extra_config ?? e.extraConfig);
  const duration =
    e.duration_minutes ?? e.durationMinutes ?? extra?.duration_minutes ?? extra?.durationMinutes;
  const passing =
    e.passing_percentage ??
    e.passingPercentage ??
    extra?.passing_percentage ??
    extra?.passingPercentage;
  const maxAttempts =
    e.max_attempts ?? e.maxAttempts ?? extra?.max_attempts ?? extra?.maxAttempts;
  const cooldown =
    e.cooldown_hours ?? e.cooldownHours ?? extra?.cooldown_hours ?? extra?.cooldownHours;

  if (typeof duration !== "number") return null;

  return {
    duration_minutes: num(duration, 60),
    passing_percentage: num(passing, 70),
    max_attempts: num(maxAttempts, 1),
    cooldown_hours: num(cooldown, 720),
  };
}

function normalizeCertificate(raw: unknown): Rec | null {
  const c = asRec(raw);
  if (!c) return null;

  const templateUrl = str(
    c.templateUrl ?? c.template_url ?? c.url ?? c.template,
  );
  if (!templateUrl) return null;

  return {
    templateUrl: toAbsoluteMediaUrl(templateUrl),
    template: toAbsoluteMediaUrl(templateUrl),
  };
}

/**
 * Maps GET /full API payload → builder store drafts.
 * Handles snake_case keys and nested enrollment/quiz shapes.
 */
export function mapApiToBuilderDrafts(apiData: unknown): CourseDrafts {
  const root = asRec(apiData) ?? {};

  const course = normalizeCourse(root.course);
  const enrollmentRaw = pick(root, ["enrollmentForm", "enrollment_form"]);
  const quizRaw = pick(root, ["quiz"]);
  const examRaw = pick(root, ["examSettings", "exam_settings"]);
  const certRaw = pick(root, ["certificate"]);

  const enrollmentForm = normalizeEnrollmentForm(enrollmentRaw);
  const quiz = normalizeQuiz(quizRaw);
  const examSettings = normalizeExamSettings(examRaw);
  const certificate = normalizeCertificate(certRaw);

  return {
    basicInfo: course,
    enrollmentForm: hasEnrollmentForm(enrollmentForm) ? enrollmentForm : null,
    quiz: hasQuiz(quiz) ? quiz : null,
    examSettings: hasExamSettings(examSettings) ? examSettings : null,
    certificate: hasCertificate(certificate) ? certificate : null,
  };
}

export function mapApiToFullCourseData(apiData: unknown) {
  const drafts = mapApiToBuilderDrafts(apiData);
  return {
    course: drafts.basicInfo,
    enrollmentForm: drafts.enrollmentForm,
    quiz: drafts.quiz,
    examSettings: drafts.examSettings,
    certificate: drafts.certificate,
  };
}
