import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, ChevronRight, Image as ImageIcon } from "lucide-react";
import { TextInput, TextareaInput, btnPrimaryClass } from "../ui/FormInputs";

const courseBasicSchema = z.object({
    title: z.string().trim().min(1, "Course title is required"),
    description: z.string().trim().optional(),
    is_ncvet: z.boolean(),
    // STRICT VALIDATION: Ensures a file or existing URL is present before allowing progression
    thumbnail: z.any().refine((val) => val !== undefined && val !== null && val !== "", "Course thumbnail is strictly required"),
});

type CourseBasicForm = z.infer<typeof courseBasicSchema>;

interface BasicInfoFormProps {
    initialData?: any;
    onSubmit: (formData: FormData, rawValues: CourseBasicForm) => Promise<void>;
    isSubmitting?: boolean;
}

export function BasicInfoForm({ initialData, onSubmit, isSubmitting = false }: BasicInfoFormProps) {

    const form = useForm<CourseBasicForm>({
        resolver: zodResolver(courseBasicSchema),
        mode: "onChange",
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            is_ncvet: initialData?.is_ncvet ?? false,
            thumbnail: initialData?.thumbnailUrl || initialData?.thumbnail || undefined
        },
    });

    useEffect(() => {
        form.reset({
            title: initialData?.title || "",
            description: initialData?.description || "",
            is_ncvet: initialData?.is_ncvet ?? false,
            thumbnail: initialData?.thumbnailUrl || initialData?.thumbnail || undefined,
        });
    }, [initialData, form]);

    const currentThumbnail = form.watch("thumbnail");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentThumbnail instanceof File) {
            const url = URL.createObjectURL(currentThumbnail);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (typeof currentThumbnail === "string" && currentThumbnail.trim() !== "") {
            setPreviewUrl(currentThumbnail);
        } else {
            setPreviewUrl(null);
        }
    }, [currentThumbnail]);

    const handleSubmit = async (values: CourseBasicForm) => {
        const fd = new FormData();
        fd.append("title", values.title);
        if (values.description) fd.append("description", values.description);
        fd.append("is_ncvet", String(values.is_ncvet));
        if (values.thumbnail instanceof File) fd.append("thumbnail", values.thumbnail);

        await onSubmit(fd, values);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">

            <div className="border-b border-admin-border/40 pb-4 mb-5 sm:mb-8">
                <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Basic Information</h2>
                <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Define the core identity and presentation of your course.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-10">
                <div className="xl:col-span-2 flex flex-col gap-5 sm:gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
                        <TextInput
                            label="Course Title"
                            placeholder="e.g. Full Stack Development"
                            error={form.formState.errors.title?.message}
                            {...form.register("title")}
                        />

                        <div className="flex items-start gap-3 mt-1 md:mt-7">
                            <input
                                type="checkbox"
                                {...form.register("is_ncvet")}
                                className="w-4 h-4 mt-0.5 rounded border-admin-border text-admin-primary focus:ring-admin-primary/20 bg-admin-card cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col">
                                <span className="text-[13px] sm:text-sm font-semibold text-admin-fg leading-none">NCVET Certified</span>
                                <span className="text-[11px] sm:text-xs text-admin-muted-foreground mt-1.5 leading-tight">Toggle if this aligns with NCVET standard guidelines.</span>
                            </div>
                        </div>
                    </div>

                    <TextareaInput
                        label="Course Description"
                        placeholder="Provide a brief overview..."
                        error={form.formState.errors.description?.message}
                        className="[&>textarea]:min-h-20 sm:[&>textarea]:min-h-30 text-[13px] sm:text-sm"
                        {...form.register("description")}
                    />
                </div>

                <div className="xl:col-span-1 flex flex-col">
                    <label className="text-[12px] sm:text-[13px] font-semibold text-admin-fg mb-2 block">Course Thumbnail <span className="text-red-500">*</span></label>
                    <Controller
                        control={form.control}
                        name="thumbnail"
                        render={({ field }) => (
                            <div className="relative flex-1 min-h-30 sm:min-h-40 w-full">
                                <label className={`absolute inset-0 flex flex-col items-center justify-center w-full h-full border border-dashed rounded-lg cursor-pointer transition-all overflow-hidden group ${form.formState.errors.thumbnail ? 'border-red-500 bg-red-500/5' : 'border-admin-border hover:border-admin-primary/50 bg-admin-bg/30 hover:bg-admin-bg'}`}>
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-30" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <div className="flex items-center gap-1.5 bg-admin-card text-admin-fg text-[11px] font-bold px-3 py-1.5 rounded shadow-sm border border-admin-border/50">
                                                    <ImageIcon className="w-3.5 h-3.5" /> Change
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-admin-muted-foreground/60 mb-2" />
                                            <p className="text-[11px] sm:text-[13px] font-medium text-admin-fg">Upload Image</p>
                                            <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-0.5">JPG, PNG under 5MB</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                </label>
                            </div>
                        )}
                    />
                    {form.formState.errors.thumbnail && (
                        <p className="mt-1.5 text-[11px] font-medium text-red-500">{(form.formState.errors.thumbnail as any).message}</p>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-4 flex justify-end border-t border-admin-border/40">
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={`${btnPrimaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    {/* BUTTON TEXT UPDATED HERE */}
                    {isSubmitting ? "Confirming..." : "Confirm & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}
