import React from "react";
import {
    Save, BookOpen, ClipboardList, Settings,
    CheckCircle2, Clock, Target, RotateCcw, Hourglass, RefreshCw
} from "lucide-react";
import { btnPrimaryClass, btnSecondaryClass, baseInputClass } from "../ui/FormInputs";

interface ReviewAndPublishProps {
    courseId: string;
    reviewData: Record<string, unknown> | null;
    loading?: boolean;
    onRefresh: () => void;
    onPublish: () => Promise<void>;
    onBack: () => void;
    isPublishing?: boolean;
}

export function ReviewAndPublish({
    courseId,
    reviewData,
    loading = false,
    onRefresh,
    onPublish,
    onBack,
    isPublishing = false,
}: ReviewAndPublishProps) {
    const basic = (reviewData?.basicInfo as Record<string, unknown>) || {};
    const enroll = (reviewData?.enrollmentForm as Record<string, unknown>) || {};
    const exam = (reviewData?.examSettings as Record<string, unknown>) || {};

    const fields = (enroll.fields as unknown[]) || [];
    const groups = (enroll.groups as unknown[]) || [];
    const ungroupedFields = (fields as { groupTempId?: string }[]).filter((f) => !f.groupTempId);
    const groupedFields = (groups as { tempId: string; label: string; sort_order: number }[])
        .map((g) => ({
            ...g,
            fields: (fields as { groupTempId?: string; sort_order: number }[])
                .filter((f) => f.groupTempId === g.tempId)
                .sort((a, b) => a.sort_order - b.sort_order),
        }))
        .sort((a, b) => a.sort_order - b.sort_order);

    const renderPreviewField = (f: {
        label: string;
        required?: boolean;
        type: string;
        config?: { placeholder?: string; options?: { label: string }[] };
    }, idx: number) => {
        const isOptions = f.type === "select" || f.type === "radio";
        return (
            <div key={idx} className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-semibold text-admin-fg">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.type === "textarea" ? (
                    <textarea disabled className={`${baseInputClass} py-1.5 px-3 text-[12px] bg-admin-bg/30 min-h-15 opacity-70`} placeholder={f.config?.placeholder || "..."} />
                ) : isOptions ? (
                    <select disabled className={`${baseInputClass} py-1.5 px-3 text-[12px] bg-admin-bg/30 opacity-70`}>
                        <option>Select an option...</option>
                        {(f.config?.options || []).map((o, i) => <option key={i}>{o.label}</option>)}
                    </select>
                ) : (
                    <input type={f.type === "checkbox" ? "checkbox" : "text"} disabled className={`${baseInputClass} ${f.type !== "checkbox" ? "py-1.5 px-3 w-full" : "w-4 h-4"} text-[12px] bg-admin-bg/30 opacity-70`} placeholder={f.config?.placeholder || "..."} />
                )}
            </div>
        );
    };

    const hasReviewData = Boolean(reviewData?.basicInfo);

    return (
        <div className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">
            <div className="border-b border-admin-border/40 pb-4 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Pre-Flight Review</h2>
                    <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Verify your configuration and preview the student experience.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Refreshing..." : "Refresh from server"}
                    </button>
                    <button
                        type="button"
                        onClick={() => void onPublish()}
                        disabled={isPublishing || !hasReviewData}
                        className={`${btnPrimaryClass} bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto text-[13px] sm:text-sm active:scale-[0.98] cursor-pointer`}
                    >
                        <Save className="w-4 h-4 mr-2" /> {isPublishing ? "Publishing..." : "Publish Course Live"}
                    </button>
                </div>
            </div>

            {!hasReviewData ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 border border-dashed border-admin-border/50 rounded-lg">
                    <p className="text-admin-muted-foreground text-[12px] sm:text-[13px] font-medium mb-4">Course data is not loaded yet.</p>
                    <button type="button" className={`${btnSecondaryClass} text-[12px] sm:text-[13px]`} onClick={onRefresh} disabled={loading}>
                        {loading ? "Fetching configuration..." : "Load course data"}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-span-2 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-4 h-4 text-admin-primary" />
                                <h3 className="text-[12px] font-bold text-admin-fg uppercase tracking-wider">Course Identity</h3>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-admin-fg">{(basic.title as string) || "Untitled Course"}</h4>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] text-admin-muted-foreground font-mono">ID: {courseId.substring(0, 8)}...</span>
                                {Boolean(basic.is_ncvet) && (
                                    <span className="text-[10px] bg-admin-primary/10 text-admin-primary px-2 py-0.5 rounded font-semibold">NCVET</span>
                                )}
                            </div>
                            <p className="text-[12px] sm:text-[13px] text-admin-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap max-w-2xl">
                                {(basic.description as string) || "No description provided for this course."}
                            </p>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Settings className="w-4 h-4 text-admin-primary" />
                                <h3 className="text-[12px] font-bold text-admin-fg uppercase tracking-wider">Exam & Rules</h3>
                            </div>
                            <div className="flex flex-col gap-2.5 bg-admin-bg/30 p-4 rounded-lg border border-admin-border/40">
                                <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                    <span className="text-admin-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</span>
                                    <span className="font-semibold text-admin-fg">{Number(exam.duration_minutes) || 0} mins</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                    <span className="text-admin-muted-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Passing Grade</span>
                                    <span className="font-semibold text-admin-fg">{Number(exam.passing_percentage) || 0}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                    <span className="text-admin-muted-foreground flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Retries</span>
                                    <span className="font-semibold text-admin-fg">{Number(exam.max_attempts) || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                    <span className="text-admin-muted-foreground flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" /> Cooldown</span>
                                    <span className="font-semibold text-admin-fg">{Number(exam.cooldown_hours) || 0} hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-admin-border/40 pt-8">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-admin-primary" />
                                <h3 className="text-[12px] font-bold text-admin-fg uppercase tracking-wider">Student Form Preview</h3>
                            </div>
                            <span className="text-[10px] bg-admin-muted/10 text-admin-muted-foreground px-2 py-1 rounded">Read Only View</span>
                        </div>

                        <div className="max-w-2xl bg-admin-card border border-admin-border/50 rounded-xl p-5 sm:p-8 shadow-sm">
                            <h4 className="text-sm sm:text-base font-bold text-admin-fg mb-1">{(enroll.name as string) || "Enrollment Form"}</h4>
                            <p className="text-[11px] text-admin-muted-foreground mb-6 pb-4 border-b border-admin-border/40">Please complete all required fields to enroll.</p>

                            {ungroupedFields.map((f, idx) => renderPreviewField(f as unknown as Parameters<typeof renderPreviewField>[0], idx))}

                            {groupedFields.map((g, gIdx) => (
                                <div key={gIdx} className="mt-6">
                                    <h5 className="text-[13px] font-semibold text-admin-fg mb-3">{g.label}</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        {g.fields.map((f, fIdx) => renderPreviewField(f as unknown as Parameters<typeof renderPreviewField>[0], fIdx))}
                                    </div>
                                </div>
                            ))}

                            {fields.length === 0 && (
                                <p className="text-[12px] text-admin-muted-foreground text-center py-6">No custom fields were added to this form.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-10 pt-4 flex flex-col sm:flex-row justify-start border-t border-admin-border/40">
                <button type="button" onClick={onBack} disabled={isPublishing} className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    Back to Edit
                </button>
            </div>
        </div>
    );
}
