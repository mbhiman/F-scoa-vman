import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { TextInput, baseInputClass, validBorderClass, errorBorderClass, btnPrimaryClass, btnSecondaryClass } from "../ui/FormInputs";

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
    const keys = val.fields.map(f => f.field_key);
    val.fields.forEach((f, idx) => {
        if (keys.indexOf(f.field_key) !== idx) {
            ctx.addIssue({ code: "custom", message: "Field Key must be unique", path: ["fields", idx, "field_key"] });
        }
        if (f.type === "select" || f.type === "radio") {
            const opts = f.config?.options;
            if (!opts || opts.length < 2) {
                ctx.addIssue({ code: "custom", message: "Select/Radio must have at least 2 options", path: ["fields", idx, "config", "options"] });
            }
        }
    });
});

type EnrollmentFormType = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormBuilderProps {
    initialData?: any;
    onSubmit: (data: EnrollmentFormType) => Promise<void>;
    onBack?: () => void;
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col bg-admin-card rounded-xl border border-admin-border/50 p-4 sm:p-8">
            <div className="border-b border-admin-border/40 pb-4 mb-6">
                <h2 className="text-[15px] sm:text-lg font-bold text-admin-fg">Enrollment Form</h2>
                <p className="text-[11px] sm:text-[13px] text-admin-muted-foreground mt-1">Design the data collection intake form for your learners.</p>
            </div>

            <div className="mb-8 max-w-xl">
                <TextInput
                    label="Form Identifier (Internal)"
                    placeholder="e.g. Standard Intake Form"
                    error={form.formState.errors.name?.message}
                    {...form.register("name")}
                />
            </div>

            {/* Form Sections (Groups) - Flat layout */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[13px] sm:text-[15px] font-semibold text-admin-fg">Form Sections</h3>
                    <button type="button" onClick={() => appendGroup({ tempId: `grp_${Date.now()}`, label: "New Section", sort_order: groups.length })} className="text-[11px] sm:text-xs font-medium text-admin-primary hover:text-admin-primary-hover flex items-center cursor-pointer transition-colors">
                        <Plus className="w-3 h-3 mr-1" /> Add Section
                    </button>
                </div>

                <div className="space-y-3">
                    {groups.length === 0 && <p className="text-[11px] sm:text-xs text-admin-muted-foreground">Fields will not be grouped into sections.</p>}
                    {groups.map((g, idx) => (
                        <div key={g.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end sm:items-center pb-3 border-b border-admin-border/30 last:border-0">
                            <div className="w-full sm:flex-1">
                                <input className={`${baseInputClass} ${validBorderClass} py-1.5 px-3 text-[13px]`} placeholder="Section Name (e.g. Personal Details)" {...form.register(`groups.${idx}.label`)} />
                            </div>
                            <div className="w-full sm:w-32">
                                <input className={`${baseInputClass} border-transparent bg-admin-bg/50 py-1.5 px-3 text-[11px] text-admin-muted-foreground font-mono`} title="System ID" {...form.register(`groups.${idx}.tempId`)} readOnly />
                            </div>
                            <button type="button" onClick={() => removeGroup(idx)} className="text-admin-muted-foreground hover:text-red-500 cursor-pointer p-1.5 rounded transition-colors self-end">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Fields - Flat layout */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[13px] sm:text-[15px] font-semibold text-admin-fg">Data Fields</h3>
                    <button type="button" onClick={() => appendField({ field_key: `f_${Date.now()}`, label: "", type: "text", required: false, sort_order: formFields.length, groupTempId: null, config: { placeholder: "" } })} className="text-[11px] sm:text-xs font-medium text-white bg-admin-primary hover:bg-admin-primary-hover px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> Add Field
                    </button>
                </div>

                {form.formState.errors.fields?.root && (
                    <div className="text-[11px] sm:text-xs text-red-500 mb-4">{form.formState.errors.fields.root.message}</div>
                )}

                <div className="space-y-6">
                    {formFields.length === 0 && <p className="text-[11px] sm:text-xs text-admin-muted-foreground py-4">No fields added to this form yet.</p>}

                    {formFields.map((f, idx) => {
                        const type = form.watch(`fields.${idx}.type`);
                        const needsOptions = type === "select" || type === "radio";

                        return (
                            <div key={f.id} className="py-4 border-b border-admin-border/40 last:border-0 relative">
                                <div className="flex justify-between items-start mb-3 sm:mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-admin-muted-foreground w-4">{idx + 1}.</span>
                                        <label className="flex items-center gap-2 text-[11px] sm:text-[13px] font-medium text-admin-fg cursor-pointer select-none">
                                            <input type="checkbox" {...form.register(`fields.${idx}.required`)} className="w-3.5 h-3.5 rounded border-admin-border text-admin-primary focus:ring-admin-primary/20 bg-admin-card cursor-pointer" />
                                            Required
                                        </label>
                                    </div>
                                    <button type="button" onClick={() => removeField(idx)} className="text-admin-muted-foreground hover:text-red-500 cursor-pointer p-1 rounded transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-4 lg:grid-cols-5 pl-7">
                                    <div className="md:col-span-2">
                                        <input className={`${baseInputClass} ${form.formState.errors.fields?.[idx]?.label ? errorBorderClass : validBorderClass} py-1.5 px-3 text-[13px]`} placeholder="Display Label (e.g. First Name)" {...form.register(`fields.${idx}.label`)} />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <input className={`${baseInputClass} ${form.formState.errors.fields?.[idx]?.field_key ? errorBorderClass : validBorderClass} py-1.5 px-3 text-[11px] font-mono`} placeholder="key (e.g. first_name)" {...form.register(`fields.${idx}.field_key`)} />
                                        <p className="mt-1 text-[10px] text-red-500">{form.formState.errors.fields?.[idx]?.field_key?.message}</p>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <select className={`${baseInputClass} ${validBorderClass} py-1.5 px-3 text-[12px] sm:text-[13px]`} {...form.register(`fields.${idx}.type`)}>
                                            {enrollmentFieldTypeSchema.options.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <select className={`${baseInputClass} ${validBorderClass} py-1.5 px-3 text-[12px] sm:text-[13px]`} value={form.watch(`fields.${idx}.groupTempId`) ?? ""} onChange={(e) => form.setValue(`fields.${idx}.groupTempId`, e.target.value || null)}>
                                            <option value="">No Section</option>
                                            {(form.getValues().groups ?? []).map(g => <option key={g.tempId} value={g.tempId}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-4 lg:col-span-5">
                                        <input className={`${baseInputClass} ${validBorderClass} py-1.5 px-3 text-[12px] sm:text-[13px] bg-transparent`} placeholder="Placeholder / Helper text..." {...form.register(`fields.${idx}.config.placeholder` as const)} />
                                    </div>
                                </div>

                                {needsOptions && (
                                    <div className="mt-3 pl-7 border-l-2 border-admin-border/50 ml-1.5 pt-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-medium text-admin-muted-foreground">Options</span>
                                            <button type="button" className="text-[10px] sm:text-[11px] font-medium text-admin-primary hover:text-admin-primary-hover cursor-pointer" onClick={() => {
                                                const curr = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                form.setValue(`fields.${idx}.config.options` as const, [...curr, { label: "", value: "" }], { shouldValidate: true });
                                            }}>+ Option</button>
                                        </div>

                                        {form.formState.errors.fields?.[idx]?.config?.options?.message && (
                                            <p className="text-[10px] text-red-500 mb-2">{form.formState.errors.fields[idx].config?.options?.message}</p>
                                        )}

                                        <div className="space-y-2">
                                            {(form.watch(`fields.${idx}.config.options` as const) ?? []).map((opt, oIdx) => (
                                                <div key={oIdx} className="flex gap-2 items-center">
                                                    <input className={`${baseInputClass} ${validBorderClass} py-1 px-2 text-[12px] w-full`} value={opt.label} placeholder="Label (e.g. Male)" onChange={(e) => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts[oIdx] = { ...opts[oIdx], label: e.target.value };
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} />
                                                    <input className={`${baseInputClass} ${validBorderClass} py-1 px-2 text-[11px] font-mono bg-admin-bg/30 w-full`} value={opt.value} placeholder="Value (e.g. m)" onChange={(e) => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts[oIdx] = { ...opts[oIdx], value: e.target.value };
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} />
                                                    <button type="button" onClick={() => {
                                                        const opts = form.getValues(`fields.${idx}.config.options` as const) ?? [];
                                                        opts.splice(oIdx, 1);
                                                        form.setValue(`fields.${idx}.config.options` as const, opts, { shouldValidate: true });
                                                    }} className="text-admin-muted-foreground hover:text-red-500 p-1 cursor-pointer">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
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

            <div className={`mt-8 pt-4 flex flex-col sm:flex-row items-center gap-3 border-t border-admin-border/40 ${onBack ? 'justify-between' : 'justify-end'}`}>
                {onBack && (
                    <button type="button" onClick={onBack} disabled={isSubmitting} className={`${btnSecondaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                        Back
                    </button>
                )}
                <button type="submit" disabled={isSubmitting || !form.formState.isValid} className={`${btnPrimaryClass} w-full sm:w-auto text-[13px] sm:text-sm cursor-pointer`}>
                    {isSubmitting ? "Saving..." : "Save & Continue"} <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
            </div>
        </form>
    );
}