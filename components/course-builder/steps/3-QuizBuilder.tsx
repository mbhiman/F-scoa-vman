import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronRight, CheckCircle2, Circle } from "lucide-react";
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
    const correctCount = q.options.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
        ctx.addIssue({ code: "custom", message: "Exactly one correct option required", path: ["options"] });
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
    isSubmitting?: boolean;
}

export function QuizBuilder({ initialData, onSubmit, onBack, isSubmitting = false }: QuizBuilderProps) {
    const form = useForm<QuizFormType>({
        resolver: zodResolver(quizSchema),
        mode: "onChange",
        defaultValues: {
            title: initialData?.title || "",
            questions: initialData?.questions?.length ? initialData.questions : [
                { question_text: "", sort_order: 0, options: [{ option_text: "", is_correct: true, sort_order: 0 }, { option_text: "", is_correct: false, sort_order: 1 }] },
            ],
        },
    });

    React.useEffect(() => {
        form.reset({
            title: initialData?.title || "",
            questions: initialData?.questions?.length ? initialData.questions : [
                { question_text: "", sort_order: 0, options: [{ option_text: "", is_correct: true, sort_order: 0 }, { option_text: "", is_correct: false, sort_order: 1 }] },
            ],
        });
    }, [initialData, form]);

    const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control: form.control, name: "questions" });

    const handleSubmit = async (values: QuizFormType) => {
        const payload = {
            ...values,
            questions: values.questions.map((q, qIdx) => ({
                ...q,
                sort_order: qIdx,
                options: q.options.map((o, oIdx) => ({ ...o, sort_order: oIdx }))
            }))
        };
        await onSubmit(payload);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">
            <div className="border-b border-admin-border/40 pb-4 mb-6">
                <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Assessment Builder</h2>
                <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Create questions and define correct answers.</p>
            </div>

            <div className="mb-8 max-w-xl">
                <TextInput
                    label="Assessment Title"
                    placeholder="e.g. Final Evaluation"
                    error={form.formState.errors.title?.message}
                    {...form.register("title")}
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[13px] sm:text-[15px] font-semibold text-admin-fg">Questions</h3>
                    <button type="button" onClick={() => appendQuestion({ question_text: "", sort_order: questions.length, options: [{ option_text: "", is_correct: true, sort_order: 0 }, { option_text: "", is_correct: false, sort_order: 1 }] })} className="text-[11px] sm:text-xs font-medium text-white bg-admin-primary hover:bg-admin-primary-hover px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> Add Question
                    </button>
                </div>

                {form.formState.errors.questions?.root && (
                    <div className="text-[11px] sm:text-xs text-red-500 mb-4">{form.formState.errors.questions.root.message}</div>
                )}

                <div className="space-y-2">
                    {questions.map((q, qIdx) => {
                        const optionsPath = `questions.${qIdx}.options` as const;
                        const options = form.watch(optionsPath) ?? [];

                        return (
                            <div key={q.id} className="py-5 border-b border-admin-border/40 last:border-0 relative">
                                <div className="flex gap-3 sm:gap-4 items-start mb-3">
                                    <span className="text-[12px] sm:text-[14px] font-semibold text-admin-muted-foreground mt-2 w-4">
                                        {qIdx + 1}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <textarea className={`${baseInputClass} ${form.formState.errors.questions?.[qIdx]?.question_text ? errorBorderClass : validBorderClass} min-h-15 py-2 px-3 text-[13px] sm:text-sm resize-y`} {...form.register(`questions.${qIdx}.question_text` as const)} placeholder="Type question..." />
                                        {form.formState.errors.questions?.[qIdx]?.question_text && (
                                            <p className="mt-1 text-[10px] text-red-500">{form.formState.errors.questions?.[qIdx]?.question_text?.message}</p>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeQuestion(qIdx)} className="p-2 text-admin-muted-foreground hover:text-red-500 rounded transition-colors cursor-pointer mt-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="pl-8 sm:pl-10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-medium text-admin-muted-foreground">Options (Select the correct one)</span>
                                        <button type="button" className="text-[10px] font-medium text-admin-primary hover:text-admin-primary-hover cursor-pointer" onClick={() => form.setValue(optionsPath, [...options, { option_text: "", is_correct: false, sort_order: options.length }], { shouldValidate: true })}>
                                            + Add Option
                                        </button>
                                    </div>

                                    {form.formState.errors.questions?.[qIdx]?.options?.root && (
                                        <p className="text-[10px] text-red-500 mb-2">{form.formState.errors.questions[qIdx].options?.root?.message}</p>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        {options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2 max-w-md">
                                                <button
                                                    type="button"
                                                    className="p-1 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        const next = options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                                                        form.setValue(optionsPath, next, { shouldValidate: true });
                                                    }}
                                                >
                                                    {opt.is_correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-admin-muted-foreground/40 hover:text-emerald-500/50" />}
                                                </button>

                                                <input
                                                    className={`${baseInputClass} ${validBorderClass} py-1.5 px-3 text-[12px] sm:text-[13px] bg-transparent w-full ${opt.is_correct ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}`}
                                                    value={opt.option_text}
                                                    placeholder={`Option ${oIdx + 1}`}
                                                    onChange={(e) => {
                                                        const next = [...options];
                                                        next[oIdx] = { ...next[oIdx], option_text: e.target.value };
                                                        form.setValue(optionsPath, next, { shouldValidate: true });
                                                    }}
                                                />
                                                <button type="button" disabled={options.length <= 2} className="p-1.5 text-admin-muted-foreground hover:text-red-500 disabled:opacity-30 cursor-pointer transition-colors" onClick={() => {
                                                    const next = [...options];
                                                    next.splice(oIdx, 1);
                                                    if (!next.some(x => x.is_correct) && next.length > 0) next[0].is_correct = true;
                                                    form.setValue(optionsPath, next, { shouldValidate: true });
                                                }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
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

            <div className="mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-admin-border/40">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>Back</button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={`${btnPrimaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    {isSubmitting ? "Saving..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}