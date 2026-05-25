import AdminCourseBuilder from "@/components/course-builder/AdminCourseBuilder";
import React, { Suspense } from "react";

function CourseBuilderFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-admin-muted-foreground text-sm">
      Loading course builder...
    </div>
  );
}

export default function AdminCourseBuilderPage() {
  return (
    <div>
      <Suspense fallback={<CourseBuilderFallback />}>
        <AdminCourseBuilder />
      </Suspense>
    </div>
  );
}
