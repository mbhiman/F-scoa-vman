import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Award, ChevronRight, UploadCloud, Image as ImageIcon } from "lucide-react";
import { btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

const certificateSchema = z.object({
    template: z.any().refine((v) => !v || v instanceof File || typeof v === 'string', { message: "Template image is required" }),
});

type CertificateFormType = z.infer<typeof certificateSchema>;

interface CertificateUploadProps {
    initialData?: any;
    onSubmit: (formData: FormData, rawValues: CertificateFormType) => Promise<void>;
    onBack: () => void;
    isSubmitting?: boolean;
}

export function CertificateUpload({ initialData, onSubmit, onBack, isSubmitting = false }: CertificateUploadProps) {
    const form = useForm<CertificateFormType>({
        resolver: zodResolver(certificateSchema),
        mode: "onChange",
        defaultValues: {
            template: initialData?.template || initialData?.templateUrl || undefined
        }
    });

    useEffect(() => {
        form.reset({
            template: initialData?.template || initialData?.templateUrl || undefined,
        });
    }, [initialData, form]);

    const currentTemplate = form.watch("template");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentTemplate instanceof File) {
            const url = URL.createObjectURL(currentTemplate);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (typeof currentTemplate === "string" && currentTemplate.trim() !== "") {
            setPreviewUrl(currentTemplate);
        } else {
            setPreviewUrl(null);
        }
    }, [currentTemplate]);

    const handleSubmit = async (values: CertificateFormType) => {
        const fd = new FormData();
        if (values.template instanceof File) {
            fd.append("template", values.template);
        }
        await onSubmit(fd, values);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">
            <div className="border-b border-admin-border/40 pb-4 mb-5 sm:mb-8">
                <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Certificate Generation</h2>
                <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Upload the background template used to stamp learner achievements.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

                {/* Upload Zone */}
                <div className="flex flex-col">
                    <label className="text-[12px] sm:text-[13px] font-semibold text-admin-fg mb-2 block">Background Template</label>
                    <Controller
                        control={form.control}
                        name="template"
                        render={({ field }) => (
                            <div className="relative flex-1 min-h-40 sm:min-h-55 w-full">
                                <label className={`absolute inset-0 flex flex-col items-center justify-center w-full h-full border border-dashed rounded-lg cursor-pointer transition-all group overflow-hidden ${form.formState.errors.template ? 'border-red-500 bg-red-500/5' : 'border-admin-border hover:border-admin-primary/50 bg-admin-bg/30 hover:bg-admin-bg'}`}>
                                    {previewUrl ? (
                                        <>
                                            <div className="absolute inset-0 bg-admin-card/50 backdrop-blur-sm z-10 transition-opacity duration-200 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 bg-admin-card text-admin-fg text-[11px] font-bold px-3 py-1.5 rounded shadow-sm border border-admin-border/50">
                                                    <ImageIcon className="w-3.5 h-3.5" /> Replace Template
                                                </div>
                                            </div>
                                            <img src={previewUrl} alt="Template Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                                            <UploadCloud className="w-8 h-8 text-admin-primary/60 mb-3" />
                                            <p className="text-[12px] sm:text-[13px] font-medium text-admin-fg">Drag & drop or click to upload</p>
                                            <p className="text-[10px] sm:text-[11px] text-admin-muted-foreground mt-1">High-resolution PNG or JPG. Recommended: 1920x1080px</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                </label>
                            </div>
                        )}
                    />
                    {form.formState.errors.template && (
                        <p className="mt-1.5 text-[11px] text-red-500">{(form.formState.errors.template as any).message}</p>
                    )}
                </div>

                {/* Live Preview Pane */}
                <div className="flex flex-col">
                    <label className="text-[12px] sm:text-[13px] font-semibold text-admin-fg mb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-admin-primary" /> Live Preview
                    </label>
                    <div className="flex-1 min-h-40 sm:min-h-55 rounded-lg border border-admin-border/40 bg-admin-bg/30 relative overflow-hidden flex items-center justify-center">
                        {previewUrl ? (
                            <div className="relative w-full h-full">
                                <img src={previewUrl} alt="Certificate Background" className="absolute inset-0 w-full h-full object-cover" />
                                {/* Overlay dummy data to simulate the final certificate look */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-black/80 font-serif text-lg sm:text-2xl mt-8 border-b border-black/20 pb-1">John Doe</span>
                                    <span className="text-black/60 text-[8px] sm:text-[10px] mt-2 uppercase tracking-widest">For successful completion of</span>
                                    <span className="text-black/80 font-bold text-[10px] sm:text-xs mt-1">The Assigned Course Title</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] text-admin-muted-foreground">Upload a template to see preview</p>
                        )}
                    </div>
                </div>

            </div>

            <div className="mt-10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-admin-border/40">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    Back
                </button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={`${btnPrimaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer active:scale-[0.98]`}>
                    {isSubmitting ? "Processing..." : "Review & Publish"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}