import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Check, ChevronRight } from "lucide-react";
import { btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

const certificateSchema = z.object({
    template: z.any().refine((v) => !v || v instanceof File || typeof v === 'string', { message: "Template image is required" }),
});

type CertificateFormType = z.infer<typeof certificateSchema>;

interface CertificateUploadProps {
    initialData?: any;
    onSubmit: (formData: FormData, rawValues: CertificateFormType) => Promise<void>;
    onBack: () => void;
}

export function CertificateUpload({ initialData, onSubmit, onBack }: CertificateUploadProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CertificateFormType>({
        resolver: zodResolver(certificateSchema),
        mode: "onChange",
        defaultValues: {
            template: initialData?.template || initialData?.templateUrl || undefined
        }
    });

    const handleSubmit = async (values: CertificateFormType) => {
        setIsSubmitting(true);
        const fd = new FormData();
        if (values.template instanceof File) {
            fd.append("template", values.template);
        }
        await onSubmit(fd, values);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4">
                <h2 className="text-lg font-semibold text-admin-fg">Certificate Generation</h2>
                <p className="text-sm text-admin-muted-foreground mt-1">Upload the background template used to stamp learner achievements.</p>
            </div>

            <div>
                <Controller
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                        <div className="flex items-center justify-center w-full">
                            <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${form.formState.errors.template ? 'border-red-500 bg-red-500/5' : 'border-admin-border bg-admin-bg hover:bg-admin-muted/10'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Award className={`w-10 h-10 mb-3 ${form.formState.errors.template ? 'text-red-500' : 'text-admin-primary'}`} />
                                    <p className="text-sm text-admin-muted-foreground">
                                        <span className="font-semibold text-admin-fg">Upload HD Template</span> (.png, .jpg)
                                    </p>
                                    {field.value && (
                                        <p className="mt-2 text-xs font-semibold text-emerald-500 flex items-center">
                                            <Check className="w-3 h-3 mr-1" /> File Attached: {field.value instanceof File ? field.value.name : 'Existing Template'}
                                        </p>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => field.onChange(e.target.files?.[0])} />
                            </label>
                        </div>
                    )}
                />
                <p className="mt-1.5 text-xs text-red-500">{(form.formState.errors.template as any)?.message}</p>
            </div>

            <div className="pt-6 flex justify-between border-t border-admin-border">
                <button type="button" onClick={onBack} disabled={isSubmitting} className={btnSecondaryClass}>
                    Back
                </button>
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={btnPrimaryClass}>
                    {isSubmitting ? "Processing..." : "Upload & Review"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}