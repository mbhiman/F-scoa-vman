"use client";

import React from "react";
import CourseEnrollView from "@/components/courses/CourseEnrollView";

export default function CourseEnrollPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = React.use(params);
  return <CourseEnrollView courseId={courseId} />;
}

