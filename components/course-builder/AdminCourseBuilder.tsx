"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useCreateCourse,
  useUpdateCourse,
  useGetFullCourse,
  useSaveEnrollmentForm,
  useSaveQuiz,
  useSaveExamSettings,
  useUploadCertificate,
  useUpdateCourseStatus,
  getMaxBuilderStep,
  mapApiToBuilderDrafts,
  type SaveEnrollmentFormPayload,
  type SaveQuizPayload,
  type SaveExamSettingsPayload,
} from "@/hooks/coursebuilder";

import { WizardHeader } from "./ui/WizardHeader";
import { WizardStepper } from "./ui/WizardStepper";
import { StatusBanner } from "./ui/StatusBanner";
import { BasicInfoForm } from "./steps/1-BasicInfoForm";
import { EnrollmentFormBuilder } from "./steps/2-EnrollmentForm";
import { QuizBuilder } from "./steps/3-QuizBuilder";
import { ExamSettingsForm } from "./steps/4-ExamSettingsForm";
import { CertificateUpload } from "./steps/5-CertificateUpload";
import { ReviewAndPublish } from "./steps/6-ReviewAndPublish";

const editStepSessionKey = (courseId: string) =>
  `scoa-admin-course-edit-step-${courseId}`;

function parseWizardStep(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (n >= 1 && n <= 6) return n;
  return null;
}

function writeEditStepSession(courseId: string, step: number) {
  sessionStorage.setItem(editStepSessionKey(courseId), String(step));
}

function clearEditStepSession(courseId: string) {
  sessionStorage.removeItem(editStepSessionKey(courseId));
}

export default function AdminCourseBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const routeCourseIdRaw = (params as Record<string, string | string[] | undefined>)?.courseId;
  const routeCourseId = Array.isArray(routeCourseIdRaw) ? routeCourseIdRaw[0] : routeCourseIdRaw;

  const flowMode = searchParams.get("mode");
  const isCreateRoute = routeCourseId === "create";
  const isCreateFlow = isCreateRoute || flowMode === "create";
  const editCourseId =
    routeCourseId && routeCourseId !== "create" ? routeCourseId : null;
  const isEditFlow = Boolean(editCourseId) && !isCreateFlow;

  /** Edit: step from URL (SSR-safe). Create: always start at step 1. */
  const urlStep = parseWizardStep(searchParams.get("step"));
  const [step, setStep] = useState(isCreateRoute ? 1 : (urlStep ?? 1));
  const [createCourseId, setCreateCourseId] = useState<string | null>(null);
  /** Create wizard: unlock next step only after previous step saved successfully. */
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [success, setSuccess] = useState("");

  /** Create: only the id created in this session. Edit: route id. */
  const activeCourseId = isCreateFlow ? createCourseId : editCourseId;

  /** Populate from API on edit, or create only after step 1 saved (back navigation). */
  const shouldLoadCourseData = isEditFlow || Boolean(createCourseId);
  const fullCourseId = shouldLoadCourseData ? activeCourseId : null;

  const populateFromApi = shouldLoadCourseData;

  const { data: fullCourse, loading: loadingFull, error: loadError, refetch } =
    useGetFullCourse(fullCourseId);

  const courseData = useMemo(() => {
    if (!fullCourse) return null;
    return mapApiToBuilderDrafts(fullCourse);
  }, [fullCourse]);

  const dataVersion = fullCourse?.course?.id ?? "empty";

  const { create, loading: creating, error: createError, validationErrors: createValidationErrors } =
    useCreateCourse();
  const { update, loading: updating, error: updateError, validationErrors: updateValidationErrors } =
    useUpdateCourse(activeCourseId);
  const { save: saveEnrollment, loading: savingEnrollment, error: enrollmentError } =
    useSaveEnrollmentForm(activeCourseId);
  const { save: saveQuiz, loading: savingQuiz, error: quizError } = useSaveQuiz(activeCourseId);
  const { save: saveExamSettings, loading: savingExam, error: examError } =
    useSaveExamSettings(activeCourseId);
  const { upload: uploadCertificate, loading: uploadingCert, error: certificateError } =
    useUploadCertificate(activeCourseId);
  const { updateStatus, loading: publishing, error: publishError } =
    useUpdateCourseStatus(activeCourseId);

  const prevEditIdRef = useRef<string | null>(null);
  const prevRouteCourseIdRef = useRef<string | undefined>(undefined);

  // Entering /admin/courses/create — blank wizard (not when already on create mid-flow)
  useEffect(() => {
    const id = routeCourseId ?? "";
    if (prevRouteCourseIdRef.current === id) return;
    prevRouteCourseIdRef.current = id;
    if (id !== "create") return;
    setCreateCourseId(null);
    setStep(1);
    setHighestStepReached(1);
    setSuccess("");
  }, [routeCourseId]);

  // Edit: restore step from URL (reload) or step 1 when opening from list (no ?step=)
  useEffect(() => {
    if (!isEditFlow || !editCourseId) return;
    if (prevEditIdRef.current === editCourseId) return;

    const urlStep = parseWizardStep(searchParams.get("step"));
    if (urlStep != null) {
      setStep(urlStep);
      writeEditStepSession(editCourseId, urlStep);
    } else {
      setStep(1);
      clearEditStepSession(editCourseId);
    }
    setSuccess("");
    prevEditIdRef.current = editCourseId;
  }, [isEditFlow, editCourseId, searchParams]);

  // Browser back/forward: stay in sync with ?step= in the URL
  const stepQuery = searchParams.get("step");
  useEffect(() => {
    if (!isEditFlow) return;
    const fromUrl = parseWizardStep(stepQuery);
    if (fromUrl != null) setStep((current) => (current === fromUrl ? current : fromUrl));
  }, [isEditFlow, stepQuery]);

  // Keep ?step= in URL so reload stays on the same wizard step while data loads
  const lastSyncedEditUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isEditFlow || !editCourseId) return;
    const target = `/admin/courses/${editCourseId}?mode=edit&step=${step}`;
    if (lastSyncedEditUrlRef.current === target) return;
    lastSyncedEditUrlRef.current = target;
    writeEditStepSession(editCourseId, step);
    router.replace(target, { scroll: false });
  }, [isEditFlow, editCourseId, step, router]);

  const syncFromServer = useCallback(() => {
    if (isEditFlow) refetch();
  }, [isEditFlow, refetch]);

  const maxAllowedStep = useMemo(() => {
    if (isCreateFlow) return highestStepReached;
    if (courseData) return getMaxBuilderStep(courseData);
    return 1;
  }, [isCreateFlow, highestStepReached, courseData]);

  const displayError = useMemo(() => {
    const hookError =
      loadError ||
      createError ||
      updateError ||
      enrollmentError ||
      quizError ||
      examError ||
      certificateError ||
      publishError;
    if (hookError) return hookError;
    const validation = [...createValidationErrors, ...updateValidationErrors];
    if (validation.length > 0) {
      return validation.map((e) => `${e.field}: ${e.message}`).join(", ");
    }
    return "";
  }, [
    loadError,
    createError,
    updateError,
    enrollmentError,
    quizError,
    examError,
    certificateError,
    publishError,
    createValidationErrors,
    updateValidationErrors,
  ]);

  const advanceCreate = (completedStep: number, nextStep: number) => {
    setHighestStepReached((prev) => Math.max(prev, completedStep + 1, nextStep));
    setStep(nextStep);
  };

  const handleStepperClick = (targetStep: number) => {
    if (targetStep > maxAllowedStep) return;
    if (targetStep < step && activeCourseId) refetch();
    setStep(targetStep);
  };

  const handleReset = () => {
    setCreateCourseId(null);
    setHighestStepReached(1);
    setStep(1);
    setSuccess("");
    router.replace("/admin/courses/create");
  };

  const handleBasicInfoSubmit = async (formData: FormData, rawValues: Record<string, unknown>) => {
    setSuccess("");

    if (isCreateFlow && !createCourseId && !activeCourseId) {
      const result = await create(formData);
      if (!result) return;

      setCreateCourseId(result.id);
      advanceCreate(1, 2);
      setSuccess("Course created. Continue to enrollment.");
      return;
    }

    if (!activeCourseId) return;
    const result = await update(formData);
    if (!result) return;

    if (isCreateFlow) {
      advanceCreate(1, 2);
      setSuccess("Basic info saved. Continue to enrollment.");
    } else {
      setStep(2);
      setSuccess("Course updated.");
      syncFromServer();
    }
  };

  const handleEnrollmentSubmit = async (data: SaveEnrollmentFormPayload) => {
    setSuccess("");
    if (!activeCourseId) return;

    const result = await saveEnrollment(data);
    if (!result) return;

    if (isCreateFlow) {
      advanceCreate(2, 3);
      setSuccess("Enrollment form saved. Continue to quiz.");
    } else {
      setStep(3);
      setSuccess("Enrollment form saved.");
      syncFromServer();
    }
  };

  const handleQuizSubmit = async (data: SaveQuizPayload) => {
    setSuccess("");
    if (!activeCourseId) return;

    const result = await saveQuiz(data);
    if (!result) return;

    if (isCreateFlow) {
      advanceCreate(3, 4);
      setSuccess("Quiz saved. Continue to exam settings.");
    } else {
      setStep(4);
      setSuccess("Quiz saved.");
      syncFromServer();
    }
  };

  const handleExamSettingsSubmit = async (data: SaveExamSettingsPayload) => {
    setSuccess("");
    if (!activeCourseId) return;

    const result = await saveExamSettings(data);
    if (!result) return;

    if (isCreateFlow) {
      advanceCreate(4, 5);
      setSuccess("Exam settings saved. Continue to certificate.");
    } else {
      setStep(5);
      setSuccess("Exam settings saved.");
      syncFromServer();
    }
  };

  const handleCertificateSubmit = async (formData: FormData, rawValues: Record<string, unknown>) => {
    setSuccess("");
    if (!activeCourseId) return;

    const result = await uploadCertificate(formData);
    if (!result) return;

    if (isCreateFlow) {
      advanceCreate(5, 6);
      setSuccess("Certificate uploaded. Review and publish.");
    } else {
      setStep(6);
      setSuccess("Certificate uploaded.");
      syncFromServer();
    }
  };

  const handlePublish = async () => {
    setSuccess("");
    if (!activeCourseId) return;

    const result = await updateStatus("PUBLISHED");
    if (!result) return;

    setSuccess("Course published successfully! Redirecting...");
    setTimeout(() => router.push("/admin/courses"), 1500);
  };

  const handleStepBack = (prevStep: number) => {
    if (activeCourseId) refetch();
    setStep(prevStep);
  };

  const reviewData = courseData;

  const isStepDataLoading =
    populateFromApi && Boolean(activeCourseId) && loadingFull && !courseData;
  const isSaving =
    creating || updating || savingEnrollment || savingQuiz || savingExam || uploadingCert || publishing;

  const showStep = (n: number) => {
    if (step !== n) return false;
    if (n >= 2 && !activeCourseId) return false;
    return true;
  };

  const StepLoading = () => (
    <div className="flex items-center justify-center py-24 text-admin-muted-foreground text-sm">
      Loading step data...
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex flex-col">
      <WizardHeader
        isEdit={isEditFlow}
        isCreate={isCreateFlow}
        courseId={activeCourseId}
        onReset={handleReset}
      />

      <WizardStepper
        currentStep={step}
        onStepClick={handleStepperClick}
        maxAllowedStep={maxAllowedStep}
        sequentialOnly={isCreateFlow}
      />

      <StatusBanner error={displayError} success={success} />

      <>
        {showStep(1) &&
          (isStepDataLoading ? (
            <StepLoading />
          ) : (
            <BasicInfoForm
              key={
                populateFromApi
                  ? `basic-${dataVersion}-${step}`
                  : `basic-new-${step}`
              }
              initialData={populateFromApi ? courseData?.basicInfo : undefined}
              onSubmit={handleBasicInfoSubmit}
              isSubmitting={creating || updating}
            />
          ))}

        {showStep(2) &&
          (isStepDataLoading ? (
            <StepLoading />
          ) : (
            <EnrollmentFormBuilder
              key={
                populateFromApi
                  ? `enrollment-${dataVersion}-${step}`
                  : `enrollment-new-${step}`
              }
              initialData={populateFromApi ? courseData?.enrollmentForm : undefined}
              onSubmit={handleEnrollmentSubmit}
              isSubmitting={savingEnrollment}
            />
          ))}

        {showStep(3) &&
          (isStepDataLoading ? (
            <StepLoading />
          ) : (
            <QuizBuilder
              key={populateFromApi ? `quiz-${dataVersion}-${step}` : `quiz-new-${step}`}
              initialData={populateFromApi ? courseData?.quiz : undefined}
              onSubmit={handleQuizSubmit}
              onBack={() => handleStepBack(2)}
              isSubmitting={savingQuiz}
            />
          ))}

        {showStep(4) &&
          (isStepDataLoading ? (
            <StepLoading />
          ) : (
            <ExamSettingsForm
              key={populateFromApi ? `exam-${dataVersion}-${step}` : `exam-new-${step}`}
              initialData={populateFromApi ? courseData?.examSettings : undefined}
              onSubmit={handleExamSettingsSubmit}
              onBack={() => handleStepBack(3)}
              isSubmitting={savingExam}
            />
          ))}

        {showStep(5) &&
          (isStepDataLoading ? (
            <StepLoading />
          ) : (
            <CertificateUpload
              key={populateFromApi ? `cert-${dataVersion}-${step}` : `cert-new-${step}`}
              initialData={populateFromApi ? courseData?.certificate : undefined}
              onSubmit={handleCertificateSubmit}
              onBack={() => handleStepBack(4)}
              isSubmitting={uploadingCert}
            />
          ))}

        {showStep(6) && activeCourseId && (
          <ReviewAndPublish
            courseId={activeCourseId}
            reviewData={reviewData as Record<string, unknown> | null}
            loading={loadingFull}
            onRefresh={syncFromServer}
            onPublish={handlePublish}
            onBack={() => handleStepBack(5)}
            isPublishing={publishing}
          />
        )}
      </>

      {isSaving && (
        <p className="text-center text-xs text-admin-muted-foreground mt-4">Saving...</p>
      )}
    </div>
  );
}
