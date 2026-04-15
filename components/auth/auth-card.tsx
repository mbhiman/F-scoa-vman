"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeIn, scaleIn } from "@/lib/animation/animations";

type AuthCardProps = {
    title: string;
    subtitle: string;
    portalLabel: string;
    children: React.ReactNode;
};

export default function AuthCard({
    title,
    subtitle,
    portalLabel,
    children,
}: AuthCardProps) {
    return (
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md lg:ml-auto"
        >
            <div className="card p-6 sm:p-8">
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                        <Image
                            src="/images/scoa-logo.png"
                            width={48}
                            height={48}
                            alt="SCOA logo"
                            className="h-12 w-auto"
                        />
                        <span className="badge-admin-accent">{portalLabel}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                    <p className="mt-1 text-sm text-muted">{subtitle}</p>
                </div>

                {children}

                <div className="mt-8 border-t border-border pt-6 lg:hidden">
                    <p className="mb-3 text-center text-xs font-medium text-muted">
                        Trusted by learners across multiple cities
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="overflow-hidden rounded-xl border border-border">
                            <Image
                                src="/images/hero-1.jpg"
                                width={200}
                                height={120}
                                alt="Learners"
                                className="h-24 w-full object-cover"
                            />
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border">
                            <Image
                                src="/images/hero-3.jpg"
                                width={200}
                                height={120}
                                alt="Training"
                                className="h-24 w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="mt-4 text-center text-xs text-muted"
            >
                A Flipkart Initiative · Supported by <span className="font-semibold">Skill India</span>
            </motion.p>
        </motion.div>
    );
}