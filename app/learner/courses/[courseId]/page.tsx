"use client";

import React from "react";
import CourseEntryView from "@/components/courses/CourseEntryView";

export default function CourseEntryPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = React.use(params);
  return <CourseEntryView courseId={courseId} />;
}

