import React, { useState } from "react";
import { Save } from "lucide-react";
import { btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

interface ReviewAndPublishProps {
    courseId: string;
    reviewData: any; // Mapped to our Zustand drafts object
    onLoadData: () => Promise<void>;
    onPublish: () => Promise<void>;
    onBack: () => void;
}

export function ReviewAndPublish({ courseId, reviewData, onLoadData, onPublish, onBack }: ReviewAndPublishProps) {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLoad = async () => {
        setIsLoading(true);
        await onLoadData();
        setIsLoading(false);
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        await onPublish();
        setIsPublishing(false);
    };

    return (
        <div className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-admin-fg">Final Review</h2>
                    <p className="text-sm text-admin-muted-foreground mt-1">Verify module configurations before pushing live.</p>
                </div>
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing || !reviewData}
                    className={`${btnPrimaryClass} bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 border-emerald-600`}
                >
                    <Save className="w-4 h-4 mr-2" /> {isPublishing ? "Publishing..." : "Publish Course"}
                </button>
            </div>

            {!reviewData ? (
                <div className="flex flex-col items-center justify-center h-48 border border-admin-border rounded-xl bg-admin-bg">
                    <p className="text-admin-muted-foreground text-sm mb-4">Course data not loaded for Review.</p>
                    <button type="button" className={btnSecondaryClass} onClick={handleLoad} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Fetch Course Data"}
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-admin-muted/10 border-b border-admin-border font-semibold text-sm text-admin-fg">1. Basic Info</div>
                        <pre className="p-4 text-xs font-mono text-admin-muted-foreground overflow-auto flex-1 max-h-48">{JSON.stringify(reviewData.basicInfo, null, 2)}</pre>
                    </div>
                    <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-admin-muted/10 border-b border-admin-border font-semibold text-sm text-admin-fg">2. Enrollment Data</div>
                        <pre className="p-4 text-xs font-mono text-admin-muted-foreground overflow-auto flex-1 max-h-48">{JSON.stringify(reviewData.enrollmentForm, null, 2)}</pre>
                    </div>
                    <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-admin-muted/10 border-b border-admin-border font-semibold text-sm text-admin-fg">3. Questionnaire</div>
                        <pre className="p-4 text-xs font-mono text-admin-muted-foreground overflow-auto flex-1 max-h-48">{JSON.stringify(reviewData.quiz, null, 2)}</pre>
                    </div>
                    <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-admin-muted/10 border-b border-admin-border font-semibold text-sm text-admin-fg">4. Parameters</div>
                        <pre className="p-4 text-xs font-mono text-admin-muted-foreground overflow-auto flex-1 max-h-48">{JSON.stringify(reviewData.examSettings, null, 2)}</pre>
                    </div>
                </div>
            )}

            <div className="pt-6 flex justify-start border-t border-admin-border">
                <button type="button" onClick={onBack} disabled={isPublishing} className={btnSecondaryClass}>
                    Back
                </button>
            </div>
        </div>
    );
}