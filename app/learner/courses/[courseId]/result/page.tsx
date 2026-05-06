"use client";

import React from "react";
import CourseResultView from "@/components/courses/CourseResultView";

export default function CourseResultPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = React.use(params);
  return <CourseResultView courseId={courseId} />;
}

