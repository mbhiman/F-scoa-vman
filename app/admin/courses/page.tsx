"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Ban, CheckCircle, PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  useListCourses,
  useDeleteCourse,
  useUpdateCourseStatus,
  type AdminCourseListItem,
  type CourseStatus,
} from "@/hooks/coursebuilder";

export default function CoursesPage() {
  const router = useRouter();
  const { data: courses, loading, error, refetch } = useListCourses({ page: 1, limit: 100 });
  const { remove, loading: deleting, error: deleteError } = useDeleteCourse();
  const { updateStatus, loading: statusLoading, error: statusError } = useUpdateCourseStatus();

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleCourseStatus = useCallback(
    async (course: AdminCourseListItem) => {
      const isDisabled = course.status === "DISABLED";
      const nextStatus: CourseStatus = isDisabled ? "DRAFT" : "DISABLED";

      if (!confirm(`Are you sure you want to ${isDisabled ? "enable" : "disable"} "${course.title}"?`)) {
        return;
      }

      setActionError(null);
      setBusyId(course.id);

      const result = await updateStatus(nextStatus, course.id);
      if (result) refetch();

      setBusyId(null);
    },
    [updateStatus, refetch],
  );

  const deleteCourse = useCallback(
    async (course: AdminCourseListItem) => {
      if (
        !confirm(
          `Delete "${course.title}"? This cannot be undone.`,
        )
      ) {
        return;
      }

      setActionError(null);
      setBusyId(course.id);

      const ok = await remove(course.id);
      if (ok) refetch();

      setBusyId(null);
    },
    [remove, refetch],
  );

  const columns: ColumnDef<AdminCourseListItem>[] = [
    {
      accessorKey: "id",
      header: "Course ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-admin-muted-foreground">
          {row.getValue<string>("id").substring(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Course Title",
      cell: ({ row }) => <span className="font-semibold text-admin-fg">{row.getValue("title")}</span>,
    },
    {
      accessorFn: (row) => (row.isNcvet ? "true" : "false"),
      id: "isNcvet",
      header: "Type",
      cell: ({ row }) => {
        const isNcvet = row.getValue("isNcvet") === "true";
        return (
          <span className={isNcvet ? "badge-admin-accent" : "badge-muted"}>
            {isNcvet ? "NCVET Certified" : "Standard"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        if (status === "PUBLISHED") return <span className="badge-success">Published</span>;
        if (status === "DRAFT") return <span className="badge-muted">Draft</span>;
        return <span className="badge-error">Disabled</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) => (
        <span className="text-admin-muted-foreground text-sm">
          {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const course = row.original;
        const isDisabled = course.status === "DISABLED";
        const isBusy = busyId === course.id && (statusLoading || deleting);

        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => router.push(`/admin/courses/${course.id}?mode=edit`)}
              disabled={isBusy}
              className="p-1.5 text-admin-muted-foreground hover:text-admin-primary hover:bg-admin-primary/10 rounded transition-colors disabled:opacity-50"
              title="Edit Course"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => void toggleCourseStatus(course)}
              disabled={isBusy}
              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                isDisabled
                  ? "text-emerald-500 hover:bg-emerald-500/10"
                  : "text-admin-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              }`}
              title={isDisabled ? "Enable Course" : "Disable Course"}
            >
              {isDisabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            </button>

            <button
              onClick={() => void deleteCourse(course)}
              disabled={isBusy}
              className="p-1.5 text-admin-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const bannerError = actionError || statusError || deleteError || error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-fg">Courses</h1>
        <p className="text-sm mt-1 text-admin-muted-foreground">
          Manage training courses, enrollments, and configurations.
        </p>
      </div>

      {bannerError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {bannerError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={courses}
        isLoading={loading}
        searchKey="title"
        searchPlaceholder="Search courses by title..."
        title="All Courses"
        description={`${courses.length} courses total`}
        actions={
          <button
            onClick={() => router.push("/admin/courses/create")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-admin-primary text-white hover:bg-admin-primary-hover active:scale-95 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Course
          </button>
        }
      />
    </div>
  );
}
