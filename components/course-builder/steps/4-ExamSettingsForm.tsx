import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { TextInput, btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

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
    isSubmitting?: boolean;
}

export function ExamSettingsForm({ initialData, onSubmit, onBack, isSubmitting = false }: ExamSettingsFormProps) {
    const form = useForm<ExamSettingsFormType>({
        resolver: zodResolver(examSettingsSchema),
        mode: "onChange",
        defaultValues: {
            duration_minutes: initialData?.duration_minutes ?? 60,
            passing_percentage: initialData?.passing_percentage ?? 70,
            max_attempts: initialData?.max_attempts ?? 1,
            cooldown_hours: initialData?.cooldown_hours ?? 720,
        },
    });

    React.useEffect(() => {
        form.reset({
            duration_minutes: initialData?.duration_minutes ?? 60,
            passing_percentage: initialData?.passing_percentage ?? 70,
            max_attempts: initialData?.max_attempts ?? 1,
            cooldown_hours: initialData?.cooldown_hours ?? 720,
        });
    }, [initialData, form]);

    const handleSubmit = async (values: ExamSettingsFormType) => {
        await onSubmit(values);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">
            <div className="border-b border-admin-border/40 pb-4 mb-6">
                <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Exam Parameters</h2>
                <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Configure grading strictness, limits, and retry cooldowns.</p>
            </div>

            <div className="grid gap-x-6 gap-y-8 grid-cols-1 md:grid-cols-2 max-w-4xl">

                <div className="flex flex-col">
                    <TextInput
                        type="number"
                        label="Time Limit (minutes)"
                        placeholder="e.g. 60"
                        error={form.formState.errors.duration_minutes?.message}
                        {...form.register("duration_minutes", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-1.5 leading-relaxed">
                        Total minutes to complete the exam. Cannot be paused once started.
                    </p>
                </div>

                <div className="flex flex-col">
                    <div className="relative">
                        <TextInput
                            type="number"
                            label="Passing Grade"
                            placeholder="e.g. 70"
                            error={form.formState.errors.passing_percentage?.message}
                            {...form.register("passing_percentage", { valueAsNumber: true })}
                        />
                        <span className="absolute right-3.5 top-8 text-[13px] font-bold text-admin-muted-foreground pointer-events-none">%</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-1.5 leading-relaxed">
                        Minimum percentage required to pass and receive a certificate.
                    </p>
                </div>

                <div className="flex flex-col">
                    <TextInput
                        type="number"
                        label="Maximum Attempts"
                        placeholder="e.g. 3"
                        error={form.formState.errors.max_attempts?.message}
                        {...form.register("max_attempts", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-1.5 leading-relaxed">
                        Total times a student can fail before being permanently locked out.
                    </p>
                </div>

                <div className="flex flex-col">
                    <div className="relative">
                        <TextInput
                            type="number"
                            label="Cooldown Period"
                            placeholder="e.g. 720"
                            error={form.formState.errors.cooldown_hours?.message}
                            {...form.register("cooldown_hours", { valueAsNumber: true })}
                        />
                        <span className="absolute right-3.5 top-8 text-[12px] font-semibold text-admin-muted-foreground pointer-events-none">hrs</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-1.5 leading-relaxed">
                        Wait time between failed attempts. Set to <span className="font-mono bg-admin-muted/10 px-1 rounded">0</span> for instant retries.
                    </p>
                </div>

            </div>

            <div className="mt-10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-admin-border/40">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    Back
                </button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={`${btnPrimaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    {isSubmitting ? "Saving..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}