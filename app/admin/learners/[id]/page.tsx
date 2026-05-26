"use client";

import { use } from "react";
import { AdminStudentProfile } from "@/components/admin/students/AdminStudentProfile";

export default function LearnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="w-full min-h-0">
      <AdminStudentProfile studentId={id} />
    </div>
  );
}
