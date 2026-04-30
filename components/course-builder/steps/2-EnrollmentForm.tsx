import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutList, FileText, Plus, Trash2, ChevronRight } from "lucide-react";
import { TextInput, baseInputClass, validBorderClass, errorBorderClass, btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

const btnDangerGhost = "inline-flex items-center justify-center rounded-lg font-medium transition-all px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 active:scale-95";

const enrollmentOptionSchema = z.object({
    label: z.string().min(1, "Required"),
    value: z.string().min(1, "Required"),
});

const enrollmentFieldTypeSchema = z.enum(["text", "textarea", "number", "email", "select", "radio", "checkbox", "date", "file"]);

const enrollmentFieldSchema = z.object({
    field_key: z.string().min(1, "Key required"),
    label: z.string().min(1, "Label required"),
    type: enrollmentFieldTypeSchema,
    required: z.boolean(),
    sort_order: z.number().int().min(0),
    groupTempId: z.string().nullable().optional(),
    config: z.object({
        placeholder: z.string().optional(),
        options: z.array(enrollmentOptionSchema).optional(),
    }).optional(),
});

const enrollmentGroupSchema = z.object({
    tempId: z.string().min(1, "ID required"),
    label: z.string().min(1, "Label required"),
    sort_order: z.number().int().min(0),
});

const enrollmentFormSchema = z.object({
    name: z.string().optional(),
    groups: z.array(enrollmentGroupSchema),
    fields: z.array(enrollmentFieldSchema).min(1, "At least 1 field is required"),
}).superRefine((val, ctx) => {
    // Prevent API 422 'Duplicate field_key(s)'
    const keys = val.fields.map(f => f.field_key);
    val.fields.forEach((f, idx) => {
        if (keys.indexOf(f.field_key) !== idx) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Field Key must be unique",
                path: ["fields", idx, "field_key"]
            });
        }

        // Ensure valid options array for select/radio
        if (f.type === "select" || f.type === "radio") {
            const opts = f.config?.options;
            if (!opts || opts.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Select/Radio must have at least 2 options",
                    path: ["fields", idx, "config", "options"]
                });
            }
        }
    });
});

type EnrollmentFormType = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormBuilderProps {
    initialData?: any;
    onSubmit: (data: EnrollmentFormType) => Promise<void>;
    onBack: () => void;
}

export function EnrollmentFormBuilder({ initialData, onSubmit, onBack }: EnrollmentFormBuilderProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<EnrollmentFormType>({
        resolver: zodResolver(enrollmentFormSchema),
        mode: "onChange",
        defaultValues: {
            name: initialData?.name || "",
            groups: initialData?.groups || [],
            fields: initialData?.fields || [],
        },
    });

    const { fields: groups, append: appendGroup, remove: removeGroup } = useFieldArray({ control: form.control, name: "groups" });
    const { fields: formFields, append: appendField, remove: removeField } = useFieldArray({ control: form.control, name: "fields" });

    const handleSubmit = async (values: EnrollmentFormType) => {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 admin-card p-6 md:p-8">
            <div className="border-b border-admin-border pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-semibold text-admin-fg">Enrollment Configuration</h2>
                    <p className="text-sm text-admin-muted-foreground mt-1">Design the data collection form for learners.</p>
                </div>
            </div>

            <TextInput
                label="Form Identifier (Optional)"
                placeholder="e.g. Standard Intake Form"
                error={form.formState.errors.name?.message}
                {...form.register("name")}
            />

            {/* GROUPS BUILDER */}
            <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden">
                <div className="bg-admin-muted/10 px-5 py-3 border-b border-admin-border flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-admin-fg flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-admin-primary" /> Form Groups
                    </h3>
                    <button type="button" onClick={() => appendGroup({ tempId: `grp_${Date.now()}`, label: "New Group", sort_order: groups.length })} className="text-xs font-semibold text-admin-primary hover:text-admin-primary-hover flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Group
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {groups.length === 0 && <p className="text-sm text-admin-muted-foreground italic">No groups defined. Fields will be ungrouped.</p>}
                    {groups.map((g, idx) => (
                        <div key={g.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-admin-border bg-admin-card shadow-sm">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Group Label</label>
                                <input className={`${baseInputClass} ${validBorderClass} py-2`} {...form.register(`groups.${idx}.label`)} />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Temp ID</label>
                                <input className={`${baseInputClass} ${validBorderClass} py-2 font-mono text-xs`} {...form.register(`groups.${idx}.tempId`)} readOnly />
                            </div>
                            <div className="flex items-end pb-1">
                                <button type="button" onClick={() => removeGroup(idx)} className="p-2 text-admin-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FIELDS BUILDER */}
            <div className="rounded-xl border border-admin-border bg-admin-bg overflow-hidden">
                <div className="bg-admin-muted/10 px-5 py-3 border-b border-admin-border flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-admin-fg flex items-center gap-2">
                        <FileText className="w-4 h-4 text-admin-primary" /> Form Fields *
                    </h3>
                    <button type="button" onClick={() => appendField({ field_key: `f_${Date.now()}`, label: "New Field", type: "text", required: false, sort_order: formFields.length, groupTempId: null, config: { placeholder: "" } })} className="text-xs font-semibold text-admin-primary hover:text-admin-primary-hover flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {form.formState.errors.fields?.root && <p className="text-xs font-medium text-red-500">{form.formState.errors.fields.root.message}</p>}

                    {formFields.map((f, idx) => {
                        const type = form.watch(`fields.${idx}.type`);
                        const needsOptions = type === "select" || type === "radio";

                        return (
                            <div key={f.id} className="p-5 rounded-lg border border-admin-border bg-admin-card shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-admin-muted/20 text-xs font-bold text-admin-fg">{idx + 1}</span>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-admin-fg cursor-pointer">
                                            <input type="checkbox" {...form.register(`fields.${idx}.required`)} className="w-4 h-4 rounded border-admin-border text-admin-primary focus:ring-admin-primary bg-admin-bg" />
                                            Required Field
                                        </label>
                                    </div>
                                    <button type="button" onClick={() => removeField(idx)} className={btnDangerGhost}>Remove</button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Label</label>
                                        <input className={`${baseInputClass} ${form.formState.errors.fields?.[idx]?.label ? errorBorderClass : validBorderClass} py-2`} {...form.register(`fields.${idx}.label`)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Key (API)</label>
                                        <input className={`${baseInputClass} ${form.formState.errors.fields?.[idx]?.field_key ? errorBorderClass : validBorderClass} py-2 font-mono text-xs`} {...form.register(`fields.${idx}.field_key`)} />
                                        <p className="mt-1 text-xs text-red-500">{form.formState.errors.fields?.[idx]?.field_key?.message}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Input Type</label>
                                        <select className={`${baseInputClass} ${validBorderClass} py-2`} {...form.register(`fields.${idx}.type`)}>
                                            {enrollmentFieldTypeSchema.options.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Group Assignment</label>
                                        <select className={`${baseInputClass} ${validBorderClass} py-2`} value={form.watch(`fields.${idx}.groupTempId`) ?? ""} onChange={(e) => form.setValue(`fields.${idx}.groupTempId`, e.target.value || null)}>
                                            <option value="">No Group</option>
                                            {(form.getValues().groups ?? []).map(g => <option key={g.tempId} value={g.tempId}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-admin-muted-foreground uppercase tracking-wider mb-1 block">Placeholder</label>
                                        <input className={`${baseInputClass} ${validBorderClass} py-2`} {...form.register(`fields.${idx}.config.placeholder` as const)} />
                                    </div>
                                </div>

                                {needsOptions && (
                                    <div className="mt-4 p-4 rounded-lg border border-admin-border bg-admin-bg/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs font-bold text-admin-fg uppercase tracking-wider">Choice Options *</label>
                                            <button type="button" className="text-xs font-semibold text-admin-primary hover:text-admin-primary-hover" onClick={() => {
                                                const curr = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                form.setValue(`fields.${idx}.config.options` as const, [...curr, { label: "New Option", value: `opt_${Date.now()}` }]);
                                            }}>+ Add Option</button>
                                        </div>
                                        {form.formState.errors.fields?.[idx]?.config?.options?.message && <p className="text-xs text-red-500 mb-2">{form.formState.errors.fields[idx].config?.options?.message}</p>}
                                        <div className="space-y-2">
                                            {(form.watch(`fields.${idx}.config.options` as const) ?? []).map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-3">
                                                    <input className={`${baseInputClass} ${validBorderClass} py-1.5 text-xs`} value={opt.label} placeholder="Label" onChange={(e) => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts[oIdx] = { ...opts[oIdx], label: e.target.value };
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} />
                                                    <input className={`${baseInputClass} ${validBorderClass} py-1.5 text-xs font-mono`} value={opt.value} placeholder="Value" onChange={(e) => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts[oIdx] = { ...opts[oIdx], value: e.target.value };
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} />
                                                    <button type="button" onClick={() => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts.splice(oIdx, 1);
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} className="text-admin-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
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