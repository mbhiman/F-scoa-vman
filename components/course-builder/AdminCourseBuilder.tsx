"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuilderStore } from "@/store/course-builder-store";
import { adminAuthFetch, parseApiError } from "@/lib/admin-api";

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

    // Load Full Course Data for Edit Mode or Review Step
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
        if (!routeCourseId || (courseId === routeCourseId && editMode)) return;
        setEditMode(true);
        void loadFullCourseData(routeCourseId);
        setStep(2);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeCourseId]);

    const handleReset = () => {
        reset();
        setEditMode(false);
        setError(""); setSuccess("");
        try { router.replace("/admin/courses"); } catch { /* ignore */ }
    };

    // --- API Submission Handlers ---

    // 3.1 Create Course
    const handleBasicInfoSubmit = async (formData: FormData, rawValues: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("basicInfo", rawValues);
            const res = await adminAuthFetch(`/admin/courses`, { method: "POST", body: formData });

            if (!res.ok) throw new Error(await parseApiError(res));
            const json = await res.json();

            setCourseId(json.data.id);
            try { router.replace(`/admin/courses/${json.data.id}`); } catch { /* ignore */ }
            setStep(2);
            setSuccess("Course created. Continue to enrollment.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to create course");
        }
    };

    // 3.4 Create / Replace Enrollment Form
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

    // 3.5 Create / Replace Quiz
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

    // 3.6 Save Exam Settings
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

    // 3.7 Upload Certificate Template
    const handleCertificateSubmit = async (formData: FormData, rawValues: any) => {
        setError(""); setSuccess("");
        try {
            setDraft("certificate", rawValues);
            const id = requireCourseId();
            const res = await adminAuthFetch(`/admin/courses/${id}/certificate`, { method: "POST", body: formData });

            if (!res.ok) throw new Error(await parseApiError(res));

            await loadFullCourseData(id); // Reload fresh data for Review step
            setStep(6);
            setSuccess("Certificate uploaded. Please review your course.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to upload certificate");
        }
    };

    // 3.2 Update Course Status
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
            setSuccess("Course published successfully!");
        } catch (e: any) {
            setError(e?.message ?? "Failed to publish course");
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <WizardHeader editMode={editMode} courseId={courseId} onReset={handleReset} />
            <WizardStepper currentStep={step} courseId={courseId} onStepClick={setStep} />
            <StatusBanner error={error} success={success} />

            {step === 1 && <BasicInfoForm initialData={drafts.basicInfo} onSubmit={handleBasicInfoSubmit} />}
            {step === 2 && <EnrollmentFormBuilder initialData={drafts.enrollmentForm} onSubmit={handleEnrollmentSubmit} onBack={() => setStep(1)} />}
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