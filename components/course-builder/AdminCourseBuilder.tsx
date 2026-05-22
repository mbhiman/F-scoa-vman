"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuilderStore } from "../../store/course-builder-store";
import { adminAuthFetch, parseApiError } from "../../lib/admin-api";

// UI Components
import { WizardHeader } from "./ui/WizardHeader";
import { WizardStepper } from "./ui/WizardStepper";
import { StatusBanner } from "./ui/StatusBanner";

// Step Components
import { BasicInfoForm } from "./steps/1-BasicInfoForm";
import { EnrollmentFormBuilder } from "./steps/2-EnrollmentForm";
import { QuizBuilder } from "./steps/3-QuizBuilder";
import { ExamSettingsForm } from "./steps/4-ExamSettingsForm";
import { CertificateUpload } from "./steps/5-CertificateUpload";
import { ReviewAndPublish } from "./steps/6-ReviewAndPublish";

export default function AdminCourseBuilder() {
    const router = useRouter();
    const params = useParams();
    const routeCourseIdRaw = (params as Record<string, string | string[] | undefined>)?.courseId;
    const routeCourseId = Array.isArray(routeCourseIdRaw) ? routeCourseIdRaw[0] : routeCourseIdRaw;

    const { step, setStep, courseId, setCourseId, drafts, setDraft, hydrateFromApi, reset } = useBuilderStore();

    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [editMode, setEditMode] = useState(false);

    const requireCourseId = () => {
        if (!courseId) throw new Error("Course not initialized yet. Please complete Basic Info first.");
        return courseId;
    };

    const loadFullCourseData = async (id: string) => {
        setError(""); setSuccess("");
        try {
            const res = await adminAuthFetch(`/admin/courses/${id}/full`);
            if (!res.ok) throw new Error(await parseApiError(res));

            const json = await res.json();
            hydrateFromApi(json.data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load course data");
        }
    };

    useEffect(() => {
        if (!routeCourseId || routeCourseId === "create") {
            if (courseId) {
                reset();
            }
            setEditMode(false);
            setStep(1);
            return;
        }

        if (courseId === routeCourseId) {
            if (!editMode) setEditMode(true);
            return;
        }

        setEditMode(true);
        void loadFullCourseData(routeCourseId);
        setStep(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeCourseId]);

    const handleReset = () => {
        reset();
        setEditMode(false);
        setError(""); setSuccess("");
        try { router.replace("/admin/courses/create"); } catch { /* ignore */ }
    };

    // --- GATEKEEPER LOGIC START ---

    // Dynamically calculate the highest step the user is allowed to view
    const maxAllowedStep = useMemo(() => {
        if (!courseId) return 1;
        if (!drafts.enrollmentForm) return 2;
        if (!drafts.quiz) return 3;
        if (!drafts.examSettings) return 4;
        if (!drafts.certificate) return 5;
        return 6;
    }, [courseId, drafts]);

    // Intercept stepper clicks to block illegal navigation
    const handleStepperClick = (targetStep: number) => {
        // Rule 1: Cannot go back to Basic Info once course ID exists
        if (courseId && targetStep === 1) return;
        // Rule 2: Cannot skip ahead of the highest completed step
        if (targetStep > maxAllowedStep) return;

        setStep(targetStep);
    };

    // --- GATEKEEPER LOGIC END ---

    const handleBasicInfoSubmit = async (formData: FormData, rawValues: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("basicInfo", rawValues);

            if (courseId) {
                const res = await adminAuthFetch(`/admin/courses/${courseId}`, {
                    method: "PATCH",
                    body: formData
                });
                if (!res.ok) throw new Error(await parseApiError(res));

                setStep(2);
                setSuccess("Course updated. Proceed to enrollment.");
                return;
            }

            const res = await adminAuthFetch(`/admin/courses`, {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error(await parseApiError(res));
            const json = await res.json();

            setCourseId(json.data.id);
            setEditMode(true);

            try { router.replace(`/admin/courses/${json.data.id}`); } catch { /* ignore */ }

            setStep(2);
            setSuccess("Course created. Continue to enrollment.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to save course basic info");
        }
    };

    const handleEnrollmentSubmit = async (data: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("enrollmentForm", data);
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/enrollment-form`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error(await parseApiError(res));
            setStep(3);
            setSuccess("Enrollment form saved.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to save enrollment");
        }
    };

    const handleQuizSubmit = async (data: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("quiz", data);
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error(await parseApiError(res));
            setStep(4);
            setSuccess("Quiz saved.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to save quiz");
        }
    };

    const handleExamSettingsSubmit = async (data: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("examSettings", data);
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/exam-settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error(await parseApiError(res));
            setStep(5);
            setSuccess("Exam settings saved.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to save exam settings");
        }
    };

    const handleCertificateSubmit = async (formData: FormData, rawValues: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("certificate", rawValues);
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/certificate`, { method: "POST", body: formData });

            if (!res.ok) throw new Error(await parseApiError(res));

            setStep(6);
            setSuccess("Certificate uploaded. Please review your course.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to upload certificate");
        }
    };

    const handlePublish = async () => {
        setError(""); setSuccess("");
        try {
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PUBLISHED" }),
            });

            if (!res.ok) throw new Error(await parseApiError(res));

            setSuccess("Course published successfully! Redirecting...");
            setTimeout(() => {
                router.push("/admin/courses");
            }, 1500);

        } catch (e: any) {
            setError(e?.message ?? "Failed to publish course");
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex flex-col">
            <WizardHeader editMode={editMode} courseId={courseId} onReset={handleReset} />

            {/* Notice we pass maxAllowedStep and the new handler here */}
            <WizardStepper
                currentStep={step}
                courseId={courseId}
                onStepClick={handleStepperClick}
                maxAllowedStep={maxAllowedStep}
            />

            <StatusBanner error={error} success={success} />

            {step === 1 && <BasicInfoForm initialData={drafts.basicInfo} onSubmit={handleBasicInfoSubmit} />}

            {/* Removed the onBack prop entirely so the button disappears */}
            {step === 2 && <EnrollmentFormBuilder initialData={drafts.enrollmentForm} onSubmit={handleEnrollmentSubmit} />}

            {step === 3 && <QuizBuilder initialData={drafts.quiz} onSubmit={handleQuizSubmit} onBack={() => setStep(2)} />}
            {step === 4 && <ExamSettingsForm initialData={drafts.examSettings} onSubmit={handleExamSettingsSubmit} onBack={() => setStep(3)} />}
            {step === 5 && <CertificateUpload initialData={drafts.certificate} onSubmit={handleCertificateSubmit} onBack={() => setStep(4)} />}
            {step === 6 && courseId && (
                <ReviewAndPublish
                    courseId={courseId}
                    reviewData={drafts}
                    onLoadData={() => loadFullCourseData(courseId)}
                    onPublish={handlePublish}
                    onBack={() => setStep(5)}
                />
            )}
        </div>
    );
}