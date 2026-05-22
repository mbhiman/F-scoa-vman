"use client";

import React from "react";
import { Check, Lock } from "lucide-react";

interface WizardStepperProps {
    currentStep: number;
    onStepClick: (step: number) => void;
    maxAllowedStep: number;
    /** Create flow: only current + completed steps are clickable */
    sequentialOnly?: boolean;
}

export function WizardStepper({ currentStep, onStepClick, maxAllowedStep, sequentialOnly = false }: WizardStepperProps) {
    const steps = [
        { num: 1, title: "Basic Info" },
        { num: 2, title: "Enrollment" },
        { num: 3, title: "Quiz" },
        { num: 4, title: "Exam Settings" },
        { num: 5, title: "Certificate" },
        { num: 6, title: "Review" },
    ];

    return (
        <div className="mb-6 w-full overflow-x-auto overflow-y-hidden custom-scrollbar pt-4 pb-10">
            <div className="flex items-center justify-between sm:justify-start min-w-max px-2 sm:px-4">
                {steps.map((step, index) => {
                    const isActive = currentStep === step.num;
                    const isCompleted = currentStep > step.num;

                    const isLocked = step.num > maxAllowedStep;

                    return (
                        <React.Fragment key={step.num}>
                            <div className="relative flex flex-col items-center">
                                <button
                                    onClick={() => !isLocked && onStepClick(step.num)}
                                    disabled={isLocked}
                                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-200 outline-none
                                        ${isActive ? 'bg-admin-primary text-white ring-4 ring-admin-primary/20 shadow-md scale-110' :
                                            isCompleted ? 'bg-admin-primary/10 text-admin-primary hover:bg-admin-primary/20' :
                                                isLocked ? 'bg-admin-bg border border-admin-border/50 text-admin-muted-foreground/40 cursor-not-allowed' :
                                                    'bg-admin-card border border-admin-border text-admin-muted-foreground hover:border-admin-primary/50 hover:text-admin-fg'}
                                    `}
                                    title={isLocked ? "Complete current step to unlock" : `Go to Step ${step.num}`}
                                >
                                    {isLocked && !isActive ? (
                                        <Lock className="w-3.5 h-3.5 opacity-60" />
                                    ) : isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        step.num
                                    )}
                                </button>

                                {/* Stepper label sitting below the circle */}
                                <span className={`absolute -bottom-7 w-max text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase transition-colors
                                    ${isActive ? 'text-admin-primary' : isCompleted ? 'text-admin-fg' : 'text-admin-muted-foreground/60'}`}
                                >
                                    {step.title}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-px w-10 sm:w-14 lg:w-20 mx-2 bg-admin-border/60 relative">
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-admin-primary transition-all duration-500 ease-in-out"
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}