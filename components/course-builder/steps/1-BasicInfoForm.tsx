import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, ChevronRight } from "lucide-react";
import { TextInput, TextareaInput, btnPrimaryClass } from "../ui/FormInputs";

const courseBasicSchema = z.object({
    title: z.string().trim().min(1, "Course title is required"),
    description: z.string().trim().optional(),
    is_ncvet: z.boolean().default(false),
    thumbnail: z.any().optional().refine((v) => !v || v instanceof File, { message: "Must be a valid file" }),
});

type CourseBasicForm = z.infer<typeof courseBasicSchema>;

interface BasicInfoFormProps {
    initialData?: any;
    onSubmit: (formData: FormData, rawValues: CourseBasicForm) => Promise<void>;
}

export function BasicInfoForm({ initialData, onSubmit }: BasicInfoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CourseBasicForm>({
        resolver: zodResolver(courseBasicSchema),
        mode: "onChange",
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            is_ncvet: initialData?.is_ncvet ?? false,
            thumbnail: undefined
        },
    });

    const handleSubmit = async (values: CourseBasicForm) => {
        setIsSubmitting(true);
        const fd = new FormData();
        fd.append("title", values.title);
        if (values.description) fd.append("description", values.description);
        fd.append("is_ncvet", String(values.is_ncvet));
        if (values.thumbnail instanceof File) fd.append("thumbnail", values.thumbnail);

        await onSubmit(fd, values);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4">
                <h2 className="text-lg font-semibold text-admin-fg">Basic Information</h2>
                <p className="text-sm text-admin-muted-foreground mt-1">Set up the core identity of the course.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <TextInput
                    label="Course Title *"
                    placeholder="e.g. Full Stack Development"
                    error={form.formState.errors.title?.message}
                    {...form.register("title")}
                />

                <div className="flex items-center gap-4 rounded-lg border border-admin-border bg-admin-bg px-5 py-3 mt-6.5">
                    <input
                        type="checkbox"
                        {...form.register("is_ncvet")}
                        className="w-5 h-5 rounded border-admin-border text-admin-primary focus:ring-admin-primary bg-admin-bg"
                    />
                    <div>
                        <p className="text-sm font-semibold text-admin-fg">NCVET Certified</p>
                        <p className="text-xs text-admin-muted-foreground mt-0.5">Toggle if this course aligns with NCVET standards.</p>
                    </div>
                </div>
            </div>

            <TextareaInput
                label="Description"
                placeholder="Provide a comprehensive overview of the course..."
                error={form.formState.errors.description?.message}
                {...form.register("description")}
            />

            <div>
                <label className="text-sm font-medium text-admin-fg mb-1.5 block">Course Thumbnail</label>
                <Controller
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-admin-border rounded-lg cursor-pointer bg-admin-bg hover:bg-admin-muted/10 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 text-admin-muted-foreground mb-3" />
                                    <p className="text-sm text-admin-muted-foreground"><span className="font-semibold text-admin-fg">Click to upload</span> or drag and drop</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => field.onChange(e.target.files?.[0])} />
                            </label>
                        </div>
                    )}
                />
                <p className="mt-1.5 text-xs text-red-500">{(form.formState.errors.thumbnail as any)?.message}</p>
            </div>

            <div className="pt-6 flex justify-end border-t border-admin-border">
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={btnPrimaryClass}>
                    {isSubmitting ? "Processing..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}