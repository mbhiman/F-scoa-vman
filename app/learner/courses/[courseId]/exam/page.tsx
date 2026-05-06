"use client";

import React from "react";
import CourseExamView from "@/components/courses/CourseExamView";

export default function CourseExamPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = React.use(params);
  return <CourseExamView courseId={courseId} />;
}

