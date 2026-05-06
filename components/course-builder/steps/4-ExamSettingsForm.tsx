import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { TextInput, btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

// Strictly aligned with API Contract 3.7
const examSettingsSchema = z.object({
    duration_minutes: z.number().int().min(1, "Min 1 minute"),
    passing_percentage: z.number().min(0).max(100, "0 to 100"),
    max_attempts: z.number().int().min(1, "Min 1 attempt"),
    cooldown_hours: z.number().int().min(0, "Min 0 hours"),
});

type ExamSettingsFormType = z.infer<typeof examSettingsSchema>;

interface ExamSettingsFormProps {
    initialData?: any;
    onSubmit: (data: ExamSettingsFormType) => Promise<void>;
    onBack: () => void;
}

export function ExamSettingsForm({ initialData, onSubmit, onBack }: ExamSettingsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ExamSettingsFormType>({
        resolver: zodResolver(examSettingsSchema),
        mode: "onChange",
        defaultValues: {
            duration_minutes: initialData?.duration_minutes ?? 60,
            passing_percentage: initialData?.passing_percentage ?? 70,
            max_attempts: initialData?.max_attempts ?? 1,
            cooldown_hours: initialData?.cooldown_hours ?? 720, // Contract defaults to 30 days (720h)
        },
    });

    const handleSubmit = async (values: ExamSettingsFormType) => {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4">
                <h2 className="text-lg font-semibold text-admin-fg">Exam Parameters</h2>
                <p className="text-sm text-admin-muted-foreground mt-1">Configure grading, attempt limits, and cooldowns.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <TextInput
                    type="number"
                    label="Time Limit (mins) *"
                    error={form.formState.errors.duration_minutes?.message}
                    {...form.register("duration_minutes", { valueAsNumber: true })}
                />
                <TextInput
                    type="number"
                    label="Passing Grade (%) *"
                    error={form.formState.errors.passing_percentage?.message}
                    {...form.register("passing_percentage", { valueAsNumber: true })}
                />
                <TextInput
                    type="number"
                    label="Max Retries *"
                    error={form.formState.errors.max_attempts?.message}
                    {...form.register("max_attempts", { valueAsNumber: true })}
                />
                <TextInput
                    type="number"
                    label="Cooldown (hours)"
                    error={form.formState.errors.cooldown_hours?.message}
                    {...form.register("cooldown_hours", { valueAsNumber: true })}
                />
            </div>

            <div className="pt-6 flex justify-between border-t border-admin-border">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={btnSecondaryClass}>
                    Back
                </button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={btnPrimaryClass}>
                    {isSubmitting ? "Processing..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}