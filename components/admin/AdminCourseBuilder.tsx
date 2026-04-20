"use client";

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";

/**
 * AdminCourseBuilder.tsx
 * - All state + API logic lives here (per requirement)
 * - Uses Module 3 APIs (admin courses)
 * - Admin auth: Bearer token only (NO refresh in contract)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const ADMIN_TOKEN_KEY = "adminAccessToken";

// DEMO MODE: disables all real API calls and uses static data.
// Flip to `false` when backend + routes are ready.
const DEMO_MODE = true;

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type ApiEnvelope<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; error?: { code?: string; details?: Array<{ field: string; message: string }> } };

type CourseStatus = "DRAFT" | "PUBLISHED" | "DISABLED";

/* -----------------------------
   Step 1: Create Course
------------------------------ */

const courseBasicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  is_ncvet: z.boolean(),
  thumbnail: z
    .any()
    .optional()
    .refine((v) => v == null || v instanceof File, { message: "Thumbnail must be a file" }),
});

type CourseBasicForm = z.infer<typeof courseBasicSchema>;

/* -----------------------------
   Step 2: Enrollment Form
------------------------------ */

const enrollmentOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
});

const enrollmentFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "email",
  "select",
  "radio",
  "checkbox",
  "date",
  "file",
]);

const enrollmentFieldSchema = z.object({
  field_key: z.string().min(1, "field_key is required"),
  label: z.string().min(1, "Label is required"),
  type: enrollmentFieldTypeSchema,
  required: z.boolean(),
  sort_order: z.number().int().min(0),
  groupTempId: z.string().nullable().optional(),
  config: z
    .object({
      placeholder: z.string().optional(),
      min_length: z.number().int().min(0).optional(),
      max_length: z.number().int().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      accept: z.string().optional(),
      options: z.array(enrollmentOptionSchema).optional(),
    })
    .optional(),
});

const enrollmentGroupSchema = z.object({
  tempId: z.string().min(1, "tempId is required"),
  label: z.string().min(1, "Group label is required"),
  sort_order: z.number().int().min(0),
});

const enrollmentFormSchema = z
  .object({
    name: z.string().optional(),
    groups: z.array(enrollmentGroupSchema),
    fields: z.array(enrollmentFieldSchema).min(1, "At least 1 field is required"),
  })
  .superRefine((val, ctx) => {
    // select/radio must have config.options
    val.fields.forEach((f, idx) => {
      if (f.type === "select" || f.type === "radio") {
        const opts = f.config?.options;
        if (!opts || opts.length < 2) {
          ctx.addIssue({
            code: "custom",
            message: "Select/Radio must have at least 2 options",
            path: ["fields", idx, "config", "options"],
          });
        }
      }
    });
  });

type EnrollmentForm = z.infer<typeof enrollmentFormSchema>;

/* -----------------------------
   Step 3: Quiz
------------------------------ */

const quizOptionSchema = z.object({
  option_text: z.string().min(1, "Option text is required"),
  is_correct: z.boolean(),
  sort_order: z.number().int().min(0),
});

const quizQuestionSchema = z
  .object({
    question_text: z.string().min(1, "Question text is required"),
    sort_order: z.number().int().min(0),
    options: z.array(quizOptionSchema).min(2, "At least 2 options required"),
  })
  .superRefine((q, ctx) => {
    const correctCount = q.options.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Each question must have exactly one correct option",
        path: ["options"],
      });
    }
  });

const quizSchema = z.object({
  title: z.string().optional(),
  questions: z.array(quizQuestionSchema).min(1, "At least 1 question required"),
});

type QuizForm = z.infer<typeof quizSchema>;

/* -----------------------------
   Step 4: Exam Settings
------------------------------ */

const examSettingsSchema = z.object({
  duration_minutes: z.number().int().min(1, "Duration must be at least 1 minute"),
  passing_percentage: z.number().min(0).max(100, "Passing % must be between 0 and 100"),
  max_attempts: z.number().int().min(1, "Max attempts must be at least 1"),
});

type ExamSettings = z.infer<typeof examSettingsSchema>;

/* -----------------------------
   Step 5: Certificate upload
------------------------------ */

const certificateSchema = z.object({
  template: z
    .any()
    .refine((v) => v instanceof File, { message: "Certificate template image is required" }),
});

type CertificateForm = z.infer<typeof certificateSchema>;

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

function buildAuthHeaders(token: string | null, extra?: HeadersInit) {
  const headers = new Headers(extra);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AdminCourseBuilder() {
  const router = useRouter();
  const params = useParams();
  const routeCourseIdRaw = (params as Record<string, string | string[] | undefined>)?.courseId;
  const routeCourseId = Array.isArray(routeCourseIdRaw) ? routeCourseIdRaw[0] : routeCourseIdRaw;

  const [step, setStep] = React.useState<Step>(1);
  const [courseId, setCourseId] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  const [editMode, setEditMode] = React.useState(false);
  const [reviewData, setReviewData] = React.useState<any>(null);

  /* -----------------------------
     Forms
  ------------------------------ */

  const courseForm = useForm<CourseBasicForm>({
    resolver: zodResolver(courseBasicSchema),
    mode: "onChange",
    defaultValues: { title: "", description: "", is_ncvet: false, thumbnail: undefined },
  });

  const enrollmentForm = useForm<EnrollmentForm>({
    resolver: zodResolver(enrollmentFormSchema),
    mode: "onChange",
    defaultValues: { name: "", groups: [], fields: [] },
  });

  const enrollmentGroups = useFieldArray({ control: enrollmentForm.control, name: "groups" });
  const enrollmentFields = useFieldArray({ control: enrollmentForm.control, name: "fields" });

  const quizForm = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      questions: [
        {
          question_text: "",
          sort_order: 0,
          options: [
            { option_text: "", is_correct: true, sort_order: 0 },
            { option_text: "", is_correct: false, sort_order: 1 },
          ],
        },
      ],
    },
  });

  const quizQuestions = useFieldArray({ control: quizForm.control, name: "questions" });

  const examForm = useForm<ExamSettings>({
    resolver: zodResolver(examSettingsSchema),
    mode: "onChange",
    defaultValues: { duration_minutes: 60, passing_percentage: 70, max_attempts: 1 },
  });

  const certForm = useForm<CertificateForm>({
    resolver: zodResolver(certificateSchema),
    mode: "onChange",
    defaultValues: { template: undefined as any },
  });

  const demoFullData = React.useMemo(
    () => ({
      course: {
        id: courseId ?? "demo-course-id",
        title: courseForm.getValues("title") || "Demo Course",
        description: courseForm.getValues("description") || "This is demo data (API disabled).",
        status: "DRAFT",
        is_ncvet: !!courseForm.getValues("is_ncvet"),
        thumbnailUrl: "/courses/thumbnails/demo.webp",
      },
      enrollmentForm: enrollmentForm.getValues(),
      quiz: quizForm.getValues(),
      examSettings: examForm.getValues(),
      certificate: { templateUrl: "/courses/certificates/demo.webp" },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courseId]
  );

  /* -----------------------------
     API helpers (still inside component)
  ------------------------------ */

  const logRequest = (url: string, method: string, body?: unknown) => {
    const safeBody =
      body instanceof FormData
        ? Object.fromEntries(Array.from(body.entries()).map(([k, v]) => [k, v instanceof File ? `File(${v.name})` : String(v)]))
        : body;

    console.log("🚀 REQUEST:", { url, method, body: safeBody });
  };

  const logResponse = (data: unknown) => {
    console.log("✅ RESPONSE:", data);
  };

  const logError = (err: unknown) => {
    console.error("❌ ERROR:", err);
  };

  const authFetch = async (path: string, init: RequestInit = {}) => {
    if (DEMO_MODE) {
      throw new Error("DEMO_MODE is enabled. API calls are disabled.");
    }
    const token = getAdminToken();
    const headers = buildAuthHeaders(token, init.headers);
    const url = `${BASE_URL}${path}`;
    const method = (init.method ?? "GET").toUpperCase();

    logRequest(url, method, init.body);

    const res = await fetch(url, {
      ...init,
      headers,
    });

    // Admin: no refresh endpoint. 401 => session invalid => clear token.
    if (res.status === 401) {
      if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      throw new Error("Admin session expired. Please sign in again.");
    }

    return res;
  };

  /* -----------------------------
     Step APIs (per requirement)
  ------------------------------ */

  const createCourse = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const valid = await courseForm.trigger();
      if (!valid) throw new Error("Please fix course details before continuing.");

      if (DEMO_MODE) {
        const newId = `demo-${Date.now()}`;
        setCourseId(newId);
        console.log("COURSE ID:", newId);
        setStep(2);
        setSuccess("DEMO: Course created (no API). Continue to enrollment form.");
        return;
      }

      const values = courseForm.getValues();
      const fd = new FormData();
      fd.append("title", values.title);
      if (values.description) fd.append("description", values.description);
      fd.append("is_ncvet", String(values.is_ncvet));
      if (values.thumbnail instanceof File) fd.append("thumbnail", values.thumbnail);

      const res = await authFetch(`/api/admin/courses`, {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as ApiEnvelope<{ id: string }>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to create course");

      setCourseId(json.data.id);
      console.log("COURSE ID:", json.data.id);
      // Optional: keep URL in sync for edit mode after creation.
      // If you mount this under /admin/courses/[courseId], this enables reload-safe editing.
      try {
        router.replace(`/admin/courses/${json.data.id}`);
      } catch {
        // ignore if route doesn't exist
      }
      setStep(2);
      setSuccess("Course created. Continue to enrollment form.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  const saveEnrollmentForm = async () => {
    if (!courseId) return setError("Missing courseId. Create course first.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const valid = await enrollmentForm.trigger();
      if (!valid) throw new Error("Please fix enrollment form before continuing.");

      if (DEMO_MODE) {
        setStep(3);
        setSuccess("DEMO: Enrollment form saved (no API).");
        return;
      }

      const payload = enrollmentForm.getValues();

      const res = await authFetch(`/api/admin/courses/${courseId}/enrollment-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to save enrollment form");

      setStep(3);
      setSuccess("Enrollment form saved.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to save enrollment form");
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!courseId) return setError("Missing courseId. Create course first.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const valid = await quizForm.trigger();
      if (!valid) throw new Error("Please fix quiz before continuing.");

      if (DEMO_MODE) {
        setStep(4);
        setSuccess("DEMO: Quiz saved (no API).");
        return;
      }

      const payload = quizForm.getValues();

      const res = await authFetch(`/api/admin/courses/${courseId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to save quiz");

      setStep(4);
      setSuccess("Quiz saved.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  const saveExamSettings = async () => {
    if (!courseId) return setError("Missing courseId. Create course first.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const valid = await examForm.trigger();
      if (!valid) throw new Error("Please fix exam settings before continuing.");

      if (DEMO_MODE) {
        setStep(5);
        setSuccess("DEMO: Exam settings saved (no API).");
        return;
      }

      const payload = examForm.getValues();

      const res = await authFetch(`/api/admin/courses/${courseId}/exam-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to save exam settings");

      setStep(5);
      setSuccess("Exam settings saved.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to save exam settings");
    } finally {
      setLoading(false);
    }
  };

  const uploadCertificate = async () => {
    if (!courseId) return setError("Missing courseId. Create course first.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const valid = await certForm.trigger();
      if (!valid) throw new Error("Please select a certificate template image.");

      if (DEMO_MODE) {
        setStep(6);
        setReviewData(demoFullData);
        setSuccess("DEMO: Certificate uploaded (no API). Review & publish.");
        return;
      }

      const values = certForm.getValues();
      const fd = new FormData();
      fd.append("template", values.template as File);

      const res = await authFetch(`/api/admin/courses/${courseId}/certificate`, {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to upload certificate template");

      setStep(6);
      setSuccess("Certificate uploaded. Review & publish.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to upload certificate");
    } finally {
      setLoading(false);
    }
  };

  const publishCourse = async () => {
    if (!courseId) return setError("Missing courseId. Create course first.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (DEMO_MODE) {
        setReviewData(demoFullData);
        setSuccess("DEMO: Published (no API).");
        return;
      }

      // review fetch
      const fullRes = await authFetch(`/api/admin/courses/${courseId}/full`, { method: "GET" });
      const fullJson = (await fullRes.json()) as ApiEnvelope<any>;
      logResponse(fullJson);
      if (!fullJson.success) throw new Error(fullJson.message || "Failed to load course for review");
      setReviewData(fullJson.data);

      // publish
      const res = await authFetch(`/api/admin/courses/${courseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" satisfies CourseStatus }),
      });

      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to publish course");

      setSuccess("Course published successfully.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to publish course");
    } finally {
      setLoading(false);
    }
  };

  const loadCourseFullForEdit = async (id: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (DEMO_MODE) {
        // Demo prefill: mimic backend shape using current form state.
        setCourseId(id);
        console.log("COURSE ID:", id);
        setEditMode(true);
        setReviewData(demoFullData);
        setStep(2);
        setSuccess("DEMO: Loaded course (no API).");
        return;
      }

      const res = await authFetch(`/api/admin/courses/${id}/full`, { method: "GET" });
      const json = (await res.json()) as ApiEnvelope<any>;
      logResponse(json);
      if (!json.success) throw new Error(json.message || "Failed to load course");

      // Best-effort prefill based on contract response shape
      const c = json.data?.course;
      if (c) {
        courseForm.setValue("title", c.title ?? "");
        courseForm.setValue("description", c.description ?? "");
        courseForm.setValue("is_ncvet", !!c.is_ncvet);
      }

      const ef = json.data?.enrollmentForm;
      if (ef) {
        enrollmentForm.reset({
          name: ef.name ?? "",
          groups: ef.groups ?? [],
          fields: ef.fields ?? [],
        });
      }

      const q = json.data?.quiz;
      if (q) {
        quizForm.reset({
          title: q.title ?? "",
          questions: q.questions ?? [],
        });
      }

      const es = json.data?.examSettings;
      if (es) {
        examForm.reset({
          duration_minutes: es.duration_minutes ?? 60,
          passing_percentage: es.passing_percentage ?? 70,
          max_attempts: es.max_attempts ?? 1,
        });
      }

      setCourseId(id);
      console.log("COURSE ID:", id);
      setEditMode(true);
      setStep(2);
      setSuccess("Loaded course. You can now update steps and publish.");
    } catch (e: any) {
      logError(e);
      setError(e?.message ?? "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  // Edit mode: if courseId is present in route, load automatically and prefill.
  React.useEffect(() => {
    if (!routeCourseId) return;
    if (courseId === routeCourseId && editMode) return;

    setCourseId(routeCourseId);
    console.log("COURSE ID:", routeCourseId);
    setEditMode(true);
    void loadCourseFullForEdit(routeCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCourseId]);

  /* -----------------------------
     UI helpers
  ------------------------------ */

  const StepShell = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-admin-card p-6 shadow-(--shadow-admin-card)">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );

  const Banner = () => {
    if (!error && !success) return null;
    return (
      <div
        className={classNames(
          "rounded-xl border px-4 py-3 text-sm mb-4",
          error ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
        )}
      >
        {error || success}
      </div>
    );
  };

  const WizardHeader = () => (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Admin Course Builder</p>
        <h1 className="text-2xl font-semibold text-foreground">Course Builder Wizard</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-border-hover"
          onClick={() => {
            setCourseId(null);
            setEditMode(false);
            setStep(1);
            setError("");
            setSuccess("");
            setReviewData(null);
            courseForm.reset({ title: "", description: "", is_ncvet: false, thumbnail: undefined });
            enrollmentForm.reset({ name: "", groups: [], fields: [] });
            quizForm.reset({
              title: "",
              questions: [
                {
                  question_text: "",
                  sort_order: 0,
                  options: [
                    { option_text: "", is_correct: true, sort_order: 0 },
                    { option_text: "", is_correct: false, sort_order: 1 },
                  ],
                },
              ],
            });
            examForm.reset({ duration_minutes: 60, passing_percentage: 70, max_attempts: 1 });
            certForm.reset({ template: undefined as any });
            try {
              router.replace("/admin/courses");
            } catch {
              // ignore
            }
          }}
        >
          New course
        </button>
      </div>
    </div>
  );

  /* -----------------------------
     Step UIs
  ------------------------------ */

  const CourseBasicUI = () => (
    <StepShell title="Step 1: Create course" subtitle="Enter basic details and create the course.">
      <form className="grid gap-4">
        <Banner />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Title *</label>
            <input className="input-field mt-1" {...courseForm.register("title")} placeholder="Course title" />
            <p className="mt-1 text-xs text-red-500">{courseForm.formState.errors.title?.message}</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input type="checkbox" {...courseForm.register("is_ncvet")} className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium text-foreground">NCVET course</p>
              <p className="text-xs text-muted">Enable if this course is for NCVET learners</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea className="input-field mt-1 min-h-24" {...courseForm.register("description")} placeholder="Optional description" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Thumbnail (optional)</label>
          <Controller
            control={courseForm.control}
            name="thumbnail"
            render={({ field }) => (
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-muted"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            )}
          />
          <p className="mt-1 text-xs text-red-500">{(courseForm.formState.errors.thumbnail as any)?.message}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted">
            {courseId ? (
              <span>
                Current courseId: <span className="font-mono text-foreground">{courseId}</span> {editMode ? "(edit)" : ""}
              </span>
            ) : (
              <span>Create course to get courseId</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => void createCourse()}
            disabled={loading || !courseForm.formState.isValid}
            className="btn btn-primary px-6 py-3 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create & Next"}
          </button>
        </div>
      </form>
    </StepShell>
  );

  const EnrollmentFormUI = () => (
    <StepShell title="Step 2: Enrollment form" subtitle="Build the enrollment form (groups + fields).">
      <div className="grid gap-4">
        <Banner />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Form name (optional)</label>
            <input className="input-field mt-1" {...enrollmentForm.register("name")} placeholder="Basic Enrollment Form" />
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted">
            Tip: for <span className="font-mono text-foreground">select</span>/<span className="font-mono text-foreground">radio</span>,
            add options in config.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Groups</h3>
            <button
              type="button"
              className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
              onClick={() =>
                enrollmentGroups.append({ tempId: `grp_${Date.now()}`, label: "New Group", sort_order: enrollmentGroups.fields.length })
              }
            >
              + Add group
            </button>
          </div>

          <div className="grid gap-3">
            {enrollmentGroups.fields.map((g, idx) => (
              <div key={g.id} className="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-3">
                <div>
                  <label className="text-xs text-muted">tempId</label>
                  <input className="input-field mt-1" {...enrollmentForm.register(`groups.${idx}.tempId`)} />
                </div>
                <div>
                  <label className="text-xs text-muted">label</label>
                  <input className="input-field mt-1" {...enrollmentForm.register(`groups.${idx}.label`)} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted">sort_order</label>
                    <input
                      type="number"
                      className="input-field mt-1"
                      {...enrollmentForm.register(`groups.${idx}.sort_order`, { valueAsNumber: true })}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                    onClick={() => enrollmentGroups.remove(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Fields *</h3>
            <button
              type="button"
              className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
              onClick={() =>
                enrollmentFields.append({
                  field_key: `field_${Date.now()}`,
                  label: "New Field",
                  type: "text",
                  required: false,
                  sort_order: enrollmentFields.fields.length,
                  groupTempId: null,
                  config: { placeholder: "" },
                })
              }
            >
              + Add field
            </button>
          </div>

          <p className="mb-2 text-xs text-red-500">{enrollmentForm.formState.errors.fields?.message as any}</p>

          <div className="grid gap-3">
            {enrollmentFields.fields.map((f, idx) => {
              const type = enrollmentForm.watch(`fields.${idx}.type`);
              const needsOptions = type === "select" || type === "radio";
              const groupTempId = enrollmentForm.watch(`fields.${idx}.groupTempId`);

              return (
                <div key={f.id} className="rounded-xl border border-border p-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="text-xs text-muted">field_key</label>
                      <input className="input-field mt-1" {...enrollmentForm.register(`fields.${idx}.field_key`)} />
                      <p className="mt-1 text-xs text-red-500">
                        {enrollmentForm.formState.errors.fields?.[idx]?.field_key?.message as any}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted">label</label>
                      <input className="input-field mt-1" {...enrollmentForm.register(`fields.${idx}.label`)} />
                      <p className="mt-1 text-xs text-red-500">
                        {enrollmentForm.formState.errors.fields?.[idx]?.label?.message as any}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted">type</label>
                      <select className="input-field mt-1" {...enrollmentForm.register(`fields.${idx}.type`)}>
                        {enrollmentFieldTypeSchema.options.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <input type="checkbox" {...enrollmentForm.register(`fields.${idx}.required`)} className="h-4 w-4" />
                        Required
                      </label>
                      <button
                        type="button"
                        className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                        onClick={() => enrollmentFields.remove(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-muted">groupTempId (optional)</label>
                      <select
                        className="input-field mt-1"
                        value={groupTempId ?? ""}
                        onChange={(e) =>
                          enrollmentForm.setValue(`fields.${idx}.groupTempId`, e.target.value ? e.target.value : null)
                        }
                      >
                        <option value="">No group</option>
                        {(enrollmentForm.getValues().groups ?? []).map((g) => (
                          <option key={g.tempId} value={g.tempId}>
                            {g.label} ({g.tempId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted">sort_order</label>
                      <input
                        type="number"
                        className="input-field mt-1"
                        {...enrollmentForm.register(`fields.${idx}.sort_order`, { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted">placeholder</label>
                      <input className="input-field mt-1" {...enrollmentForm.register(`fields.${idx}.config.placeholder` as const)} />
                    </div>
                  </div>

                  {needsOptions ? (
                    <div className="mt-3 rounded-xl border border-border bg-admin-bg p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Options (required)</p>
                        <button
                          type="button"
                          className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                          onClick={() => {
                            const current = enrollmentForm.getValues(`fields.${idx}.config.options` as const) ?? [];
                            enrollmentForm.setValue(`fields.${idx}.config.options` as const, [
                              ...current,
                              { label: "Option", value: `opt_${Date.now()}` },
                            ]);
                          }}
                        >
                          + Add option
                        </button>
                      </div>

                      <p className="text-xs text-red-500">
                        {enrollmentForm.formState.errors.fields?.[idx]?.config?.options?.message as any}
                      </p>

                      <div className="grid gap-2">
                        {(enrollmentForm.watch(`fields.${idx}.config.options` as const) ?? []).map((opt, oIdx) => (
                          <div key={`${idx}-${oIdx}`} className="grid gap-2 md:grid-cols-3">
                            <input
                              className="input-field"
                              value={opt.label}
                              onChange={(e) => {
                                const opts = enrollmentForm.getValues(`fields.${idx}.config.options` as const) ?? [];
                                opts[oIdx] = { ...opts[oIdx], label: e.target.value };
                                enrollmentForm.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                              }}
                              placeholder="Label"
                            />
                            <input
                              className="input-field"
                              value={opt.value}
                              onChange={(e) => {
                                const opts = enrollmentForm.getValues(`fields.${idx}.config.options` as const) ?? [];
                                opts[oIdx] = { ...opts[oIdx], value: e.target.value };
                                enrollmentForm.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                              }}
                              placeholder="Value"
                            />
                            <button
                              type="button"
                              className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                              onClick={() => {
                                const opts = enrollmentForm.getValues(`fields.${idx}.config.options` as const) ?? [];
                                opts.splice(oIdx, 1);
                                enrollmentForm.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover"
            onClick={() => setStep(1)}
          >
            Back
          </button>

          <button type="button" className="btn btn-primary px-6 py-3 disabled:opacity-60" disabled={loading} onClick={() => void saveEnrollmentForm()}>
            {loading ? "Saving..." : "Save & Next"}
          </button>
        </div>
      </div>
    </StepShell>
  );

  const QuizUI = () => (
    <StepShell title="Step 3: Quiz" subtitle="Add questions and options. Exactly one correct answer per question.">
      <div className="grid gap-4">
        <Banner />

        <div>
          <label className="text-sm font-medium text-foreground">Quiz title (optional)</label>
          <input className="input-field mt-1" {...quizForm.register("title")} placeholder="Module 1 Assessment" />
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Questions *</h3>
            <button
              type="button"
              className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
              onClick={() =>
                quizQuestions.append({
                  question_text: "",
                  sort_order: quizQuestions.fields.length,
                  options: [
                    { option_text: "", is_correct: true, sort_order: 0 },
                    { option_text: "", is_correct: false, sort_order: 1 },
                  ],
                })
              }
            >
              + Add question
            </button>
          </div>

          <p className="mb-2 text-xs text-red-500">{quizForm.formState.errors.questions?.message as any}</p>

          <div className="grid gap-3">
            {quizQuestions.fields.map((q, qIdx) => {
              const optionsPath = `questions.${qIdx}.options` as const;
              const options = quizForm.watch(optionsPath) ?? [];

              return (
                <div key={q.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted">Question text</label>
                      <input className="input-field mt-1" {...quizForm.register(`questions.${qIdx}.question_text` as const)} />
                      <p className="mt-1 text-xs text-red-500">
                        {quizForm.formState.errors.questions?.[qIdx]?.question_text?.message as any}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                      onClick={() => quizQuestions.remove(qIdx)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-border bg-admin-bg p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Options *</p>
                      <button
                        type="button"
                        className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                        onClick={() => {
                          quizForm.setValue(optionsPath, [...options, { option_text: "", is_correct: false, sort_order: options.length }], {
                            shouldValidate: true,
                          });
                        }}
                      >
                        + Add option
                      </button>
                    </div>

                    <p className="text-xs text-red-500">
                      {quizForm.formState.errors.questions?.[qIdx]?.options?.message as any}
                    </p>

                    <div className="grid gap-2">
                      {options.map((opt, oIdx) => (
                        <div key={`${qIdx}-${oIdx}`} className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                          <input
                            className="input-field"
                            value={opt.option_text}
                            onChange={(e) => {
                              const next = [...options];
                              next[oIdx] = { ...next[oIdx], option_text: e.target.value };
                              quizForm.setValue(optionsPath, next, { shouldValidate: true });
                            }}
                            placeholder={`Option ${oIdx + 1}`}
                          />

                          <label className="flex items-center gap-2 text-sm text-muted">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={opt.is_correct}
                              onChange={() => {
                                const next = options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                                quizForm.setValue(optionsPath, next, { shouldValidate: true });
                              }}
                            />
                            Correct
                          </label>

                          <button
                            type="button"
                            className="rounded-xl border border-border px-3 py-2 text-sm hover:border-border-hover"
                            onClick={() => {
                              const next = [...options];
                              next.splice(oIdx, 1);
                              // ensure at least one correct remains
                              if (!next.some((x) => x.is_correct) && next.length > 0) next[0].is_correct = true;
                              quizForm.setValue(optionsPath, next, { shouldValidate: true });
                            }}
                            disabled={options.length <= 2}
                            title={options.length <= 2 ? "At least 2 options required" : "Remove option"}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover"
            onClick={() => setStep(2)}
          >
            Back
          </button>

          <button
            type="button"
            className="btn btn-primary px-6 py-3 disabled:opacity-60"
            disabled={loading || !quizForm.formState.isValid}
            onClick={() => void saveQuiz()}
          >
            {loading ? "Saving..." : "Save & Next"}
          </button>
        </div>
      </div>
    </StepShell>
  );

  const ExamSettingsUI = () => (
    <StepShell title="Step 4: Exam settings" subtitle="Set duration, passing percentage, and max attempts.">
      <div className="grid gap-4">
        <Banner />

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
            <input type="number" className="input-field mt-1" {...examForm.register("duration_minutes", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-red-500">{examForm.formState.errors.duration_minutes?.message}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Passing %</label>
            <input type="number" className="input-field mt-1" {...examForm.register("passing_percentage", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-red-500">{examForm.formState.errors.passing_percentage?.message}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Max attempts</label>
            <input type="number" className="input-field mt-1" {...examForm.register("max_attempts", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-red-500">{examForm.formState.errors.max_attempts?.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover"
            onClick={() => setStep(3)}
          >
            Back
          </button>

          <button
            type="button"
            className="btn btn-primary px-6 py-3 disabled:opacity-60"
            disabled={loading || !examForm.formState.isValid}
            onClick={() => void saveExamSettings()}
          >
            {loading ? "Saving..." : "Save & Next"}
          </button>
        </div>
      </div>
    </StepShell>
  );

  const CertificateUploadUI = () => (
    <StepShell title="Step 5: Certificate" subtitle="Upload the certificate template image.">
      <div className="grid gap-4">
        <Banner />

        <div>
          <label className="text-sm font-medium text-foreground">Template image *</label>
          <Controller
            control={certForm.control}
            name="template"
            render={({ field }) => (
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-muted"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            )}
          />
          <p className="mt-1 text-xs text-red-500">{(certForm.formState.errors.template as any)?.message}</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover"
            onClick={() => setStep(4)}
          >
            Back
          </button>

        <button
          type="button"
          className="btn btn-primary px-6 py-3 disabled:opacity-60"
          disabled={loading || !certForm.formState.isValid}
          onClick={() => void uploadCertificate()}
        >
            {loading ? "Uploading..." : "Upload & Next"}
          </button>
        </div>
      </div>
    </StepShell>
  );

  const ReviewPublishUI = () => (
    <StepShell title="Step 6: Review & Publish" subtitle="Fetch full course data and publish when ready.">
      <div className="grid gap-4">
        <Banner />

        <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
          <p>
            CourseId: <span className="font-mono text-foreground">{courseId ?? "—"}</span>
          </p>
          <p className="mt-1">Click Refresh Review to fetch `/full`. Publish will fetch `/full` and then PATCH status to PUBLISHED.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover disabled:opacity-60"
            disabled={loading || !courseId}
            onClick={async () => {
              if (!courseId) return;
              setLoading(true);
              setError("");
              try {
                const fullRes = await authFetch(`/api/admin/courses/${courseId}/full`, { method: "GET" });
                const fullJson = (await fullRes.json()) as ApiEnvelope<any>;
                logResponse(fullJson);
                if (!fullJson.success) throw new Error(fullJson.message || "Failed to load course for review");
                setReviewData(fullJson.data);
                setSuccess("Review refreshed.");
              } catch (e: any) {
                logError(e);
                setError(e?.message ?? "Failed to refresh review");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Loading..." : "Refresh Review"}
          </button>
        </div>

        {reviewData ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Course</h3>
              <pre className="mt-2 overflow-auto rounded-xl bg-admin-bg p-3 text-xs text-muted">
                {JSON.stringify(reviewData.course ?? {}, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Enrollment Form</h3>
              <pre className="mt-2 overflow-auto rounded-xl bg-admin-bg p-3 text-xs text-muted">
                {JSON.stringify(reviewData.enrollmentForm ?? {}, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Quiz</h3>
              <pre className="mt-2 overflow-auto rounded-xl bg-admin-bg p-3 text-xs text-muted">
                {JSON.stringify(reviewData.quiz ?? {}, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Exam Settings</h3>
              <pre className="mt-2 overflow-auto rounded-xl bg-admin-bg p-3 text-xs text-muted">
                {JSON.stringify(reviewData.examSettings ?? {}, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">Certificate</h3>
              <pre className="mt-2 overflow-auto rounded-xl bg-admin-bg p-3 text-xs text-muted">
                {JSON.stringify(reviewData.certificate ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm hover:border-border-hover"
            onClick={() => setStep(5)}
          >
            Back
          </button>

          <button type="button" className="btn btn-primary px-6 py-3 disabled:opacity-60" disabled={loading} onClick={() => void publishCourse()}>
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </StepShell>
  );

  /* -----------------------------
     Render
  ------------------------------ */

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WizardHeader />

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className={classNames("rounded-full border px-3 py-1", step === 1 && "border-primary text-foreground")}>1</span>
          <span className={classNames("rounded-full border px-3 py-1", step === 2 && "border-primary text-foreground")}>2</span>
          <span className={classNames("rounded-full border px-3 py-1", step === 3 && "border-primary text-foreground")}>3</span>
          <span className={classNames("rounded-full border px-3 py-1", step === 4 && "border-primary text-foreground")}>4</span>
          <span className={classNames("rounded-full border px-3 py-1", step === 5 && "border-primary text-foreground")}>5</span>
          <span className={classNames("rounded-full border px-3 py-1", step === 6 && "border-primary text-foreground")}>6</span>
          <span className="ml-2">
            {editMode ? "Edit mode" : "Create mode"} • {courseId ? `courseId: ${courseId}` : "no courseId yet"}
          </span>
        </div>

        {step === 1 ? <CourseBasicUI /> : null}
        {step === 2 ? <EnrollmentFormUI /> : null}
        {step === 3 ? <QuizUI /> : null}
        {step === 4 ? <ExamSettingsUI /> : null}
        {step === 5 ? <CertificateUploadUI /> : null}
        {step === 6 ? <ReviewPublishUI /> : null}
      </div>
    </div>
  );
}