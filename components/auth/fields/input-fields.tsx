"use client";

import React from "react";

type InputFieldProps = {
    label: string;
    error?: string;
    icon?: React.ReactNode;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function InputField({
    label,
    error,
    icon,
    className = "",
    ...rest
}: InputFieldProps) {
    const hasIcon = Boolean(icon);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
                {label}
            </label>

            <div className="relative">
                {hasIcon && (
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                        {icon}
                    </span>
                )}

                <input
                    {...rest}
                    className={[
                        "input-field",
                        hasIcon ? "pl-12 pr-4" : "px-4",
                        error ? "border-red-500" : "",
                        className,
                    ].join(" ")}
                />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}