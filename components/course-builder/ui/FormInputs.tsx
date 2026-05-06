import React, { forwardRef } from "react";

// --- Centralized Tailwind Utility Classes ---
export const baseInputClass = "w-full rounded-lg bg-admin-bg text-sm text-admin-fg outline-none transition-all placeholder:text-admin-muted border focus:ring-4 focus:ring-admin-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
export const validBorderClass = "border-admin-border focus:border-admin-primary";
export const errorBorderClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

export const btnPrimaryClass = "inline-flex items-center justify-center rounded-lg font-medium transition-all px-5 py-2.5 text-sm bg-admin-primary text-white hover:bg-admin-primary-hover active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
export const btnSecondaryClass = "inline-flex items-center justify-center rounded-lg font-medium transition-all px-5 py-2.5 text-sm border border-admin-border bg-admin-bg text-admin-fg hover:bg-admin-muted/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

// --- Reusable Input Components ---

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ label, error, className = "", ...props }, ref) => {
        const borderClass = error ? errorBorderClass : validBorderClass;

        return (
            <div className={className}>
                {label && (
                    <label className="text-sm font-medium text-admin-fg mb-1.5 block">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`${baseInputClass} ${borderClass} px-4 py-2.5`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
TextInput.displayName = "TextInput";


export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
    ({ label, error, className = "", ...props }, ref) => {
        const borderClass = error ? errorBorderClass : validBorderClass;

        return (
            <div className={className}>
                {label && (
                    <label className="text-sm font-medium text-admin-fg mb-1.5 block">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`${baseInputClass} ${borderClass} px-4 py-3 min-h-30 resize-y`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
TextareaInput.displayName = "TextareaInput";