"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeIn, slideUp } from "@/lib/animation/animations";

export default function CoursePageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-4xl px-4 py-8">
      <motion.div variants={slideUp} className="mb-6 space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Course</p>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex gap-2">{actions}</div> : null}
        </div>
      </motion.div>

      <motion.div variants={slideUp} className="card p-5 sm:p-6">
        {children}
      </motion.div>
    </motion.div>
  );
}

