import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Trash2, ChevronRight } from "lucide-react";
import { TextInput, baseInputClass, validBorderClass, errorBorderClass, btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

const quizOptionSchema = z.object({
    option_text: z.string().trim().min(1, "Required"),
    is_correct: z.boolean(),
    sort_order: z.number().int().min(0),
});

const quizQuestionSchema = z.object({
    question_text: z.string().trim().min(1, "Question text is required"),
    sort_order: z.number().int().min(0),
    options: z.array(quizOptionSchema).min(2, "At least 2 options required"),
}).superRefine((q, ctx) => {
    // API Contract strict rule: Exactly ONE option must be true
    const correctCount = q.options.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Exactly one correct option required",
            path: ["options"]
        });
    }
});

const quizSchema = z.object({
    title: z.string().trim().optional(),
    questions: z.array(quizQuestionSchema).min(1, "At least 1 question required"),
});

type QuizFormType = z.infer<typeof quizSchema>;

interface QuizBuilderProps {
    initialData?: any;
    onSubmit: (data: QuizFormType) => Promise<void>;
    onBack: () => void;
}

export function QuizBuilder({ initialData, onSubmit, onBack }: QuizBuilderProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<QuizFormType>({
        resolver: zodResolver(quizSchema),
        mode: "onChange",
        defaultValues: {
            title: initialData?.title || "",
            questions: initialData?.questions?.length ? initialData.questions : [
                {
                    question_text: "",
                    sort_order: 0,
                    options: [
                        { option_text: "", is_correct: true, sort_order: 0 },
                        { option_text: "", is_correct: false, sort_order: 1 }
                    ]
                },
            ],
        },
    });

    const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const handleSubmit = async (values: QuizFormType) => {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4">
                <h2 className="text-lg font-semibold text-admin-fg">Quiz Construction</h2>
                <p className="text-sm text-admin-muted-foreground mt-1">Add questions and assign exactly one correct answer per question.</p>
            </div>

            <TextInput
                label="Assessment Title"
                placeholder="e.g. Final Evaluation"
                error={form.formState.errors.title?.message}
                {...form.register("title")}
            />

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h3 className="text-sm font-semibold text-admin-fg flex items-center gap-2">
                        <FileText className="w-4 h-4 text-admin-primary" /> Questionnaire *
                    </h3>
                    <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-admin-muted/20 text-admin-fg hover:bg-admin-muted/40 transition-colors"
                        onClick={() => appendQuestion({
                            question_text: "", sort_order: questions.length,
                            options: [{ option_text: "", is_correct: true, sort_order: 0 }, { option_text: "", is_correct: false, sort_order: 1 }]
                        })}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                    </button>
                </div>

                {form.formState.errors.questions?.root && <p className="text-xs font-medium text-red-500">{form.formState.errors.questions.root.message}</p>}

                {questions.map((q, qIdx) => {
                    const optionsPath = `questions.${qIdx}.options` as const;
                    const options = form.watch(optionsPath) ?? [];

                    return (
                        <div key={q.id} className="p-5 rounded-xl border border-admin-border bg-admin-bg shadow-sm space-y-4">
                            <div className="flex gap-4 items-start">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-admin-primary/10 text-admin-primary text-sm font-bold shrink-0">Q{qIdx + 1}</span>
                                <div className="flex-1">
                                    <textarea
                                        className={`${baseInputClass} ${form.formState.errors.questions?.[qIdx]?.question_text ? errorBorderClass : validBorderClass} min-h-20 resize-y`}
                                        {...form.register(`questions.${qIdx}.question_text` as const)}
                                        placeholder="Enter the question text here..."
                                    />
                                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.questions?.[qIdx]?.question_text?.message}</p>
                                </div>
                                <button type="button" onClick={() => removeQuestion(qIdx)} className="p-2 text-admin-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="ml-11 p-4 rounded-lg border border-admin-border bg-admin-card">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-admin-fg uppercase tracking-wider">Answer Options</label>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-admin-primary hover:text-admin-primary-hover"
                                        onClick={() => form.setValue(optionsPath, [...options, { option_text: "", is_correct: false, sort_order: options.length }], { shouldValidate: true })}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                {form.formState.errors.questions?.[qIdx]?.options?.root && <p className="text-xs text-red-500 mb-2">{form.formState.errors.questions[qIdx].options?.root?.message}</p>}

                                <div className="space-y-3">
                                    {options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`flex items-center gap-3 p-2 rounded-lg border ${opt.is_correct ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-admin-border bg-admin-bg'}`}>
                                            <input
                                                type="radio"
                                                name={`correct-${qIdx}`}
                                                checked={opt.is_correct}
                                                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-admin-bg border-admin-border cursor-pointer ml-2"
                                                onChange={() => {
                                                    // Only one can be true
                                                    const next = options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                                                    form.setValue(optionsPath, next, { shouldValidate: true });
                                                }}
                                            />
                                            <input
                                                className={`${baseInputClass} border-transparent bg-transparent focus:bg-admin-bg focus:border-admin-primary py-1.5 flex-1 ${opt.is_correct ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}
                                                value={opt.option_text}
                                                placeholder={`Option ${oIdx + 1}`}
                                                onChange={(e) => {
                                                    const next = [...options];
                                                    next[oIdx] = { ...next[oIdx], option_text: e.target.value };
                                                    form.setValue(optionsPath, next, { shouldValidate: true });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                disabled={options.length <= 2}
                                                className="p-2 text-admin-muted-foreground hover:text-red-500 disabled:opacity-30"
                                                onClick={() => {
                                                    const next = [...options];
                                                    next.splice(oIdx, 1);
                                                    if (!next.some(x => x.is_correct) && next.length > 0) next[0].is_correct = true; // Auto-assign correct if deleted
                                                    form.setValue(optionsPath, next, { shouldValidate: true });
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6 flex justify-between border-t border-admin-border">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={btnSecondaryClass}>Back</button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={btnPrimaryClass}>
                    {isSubmitting ? "Processing..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}