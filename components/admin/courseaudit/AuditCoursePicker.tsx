"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, ChevronDown, Loader2, Search } from "lucide-react";
import {
  useListCourses,
  type AdminCourseListItem,
} from "@/hooks/coursebuilder/useListCourses";
import {
  AuditMotionButton,
  auditFieldInput,
  auditFieldLabel,
  CourseStatusBadge,
} from "./course-audit-ui";

const PICKER_PAGE_SIZE = 50;

type Props = {
  value: string;
  onChange: (courseId: string, course?: AdminCourseListItem | null) => void;
  id?: string;
};

export function AuditCoursePicker({
  value,
  onChange,
  id = "course-log-course-picker",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [courseSearch, setCourseSearch] = useState("");
  const [accumulated, setAccumulated] = useState<AdminCourseListItem[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const listFilters = useMemo(
    () => ({
      page: pickerPage,
      limit: PICKER_PAGE_SIZE,
      search: courseSearch.trim() || undefined,
    }),
    [pickerPage, courseSearch],
  );

  const { data, meta, loading, error, refetch } = useListCourses(listFilters);

  useEffect(() => {
    if (pickerPage === 1) {
      setAccumulated(data);
      return;
    }
    setAccumulated((prev) => {
      const seen = new Set(prev.map((c) => c.id));
      const next = data.filter((c) => !seen.has(c.id));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
  }, [data, pickerPage]);

  useEffect(() => {
    setPickerPage(1);
    setAccumulated([]);
  }, [courseSearch]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel(null);
      return;
    }
    const match = accumulated.find((c) => c.id === value);
    if (match) {
      setSelectedLabel(match.title);
    }
  }, [value, accumulated]);

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const canLoadMore = Boolean(meta?.hasNext) && !loading;

  const handleLoadMore = () => {
    if (canLoadMore) setPickerPage((p) => p + 1);
  };

  const handleSelect = (course: AdminCourseListItem | null) => {
    if (!course) {
      onChange("", null);
      setSelectedLabel(null);
    } else {
      onChange(course.id, course);
      setSelectedLabel(course.title);
    }
    setOpen(false);
  };

  const displayLabel = value ? (selectedLabel ?? "Selected course") : "All courses";

  return (
    <div ref={rootRef} className="relative w-full">
      <span id={`${id}-label`} className={auditFieldLabel}>
        Course
      </span>

      <AuditMotionButton
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
        className={`mt-1.5 flex h-11 w-full items-center justify-between gap-2 px-3.5 text-left text-sm font-medium ${auditFieldInput} ${
          open ? "border-admin-primary ring-2 ring-admin-primary/15" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-admin-primary" aria-hidden />
          <span
            className={`truncate ${value ? "text-admin-fg" : "text-admin-muted-foreground"}`}
          >
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-admin-primary" : "text-admin-muted-foreground"}`}
          aria-hidden
        />
      </AuditMotionButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="mt-1.5 overflow-hidden rounded-xl border border-admin-border bg-admin-card shadow-[0_12px_32px_-10px_rgba(0,0,0,0.2)]"
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            <div className="border-b border-admin-border p-2">
              <div className="flex items-center gap-2 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 focus-within:border-admin-primary focus-within:ring-2 focus-within:ring-admin-primary/15">
                <Search className="h-4 w-4 shrink-0 text-admin-muted-foreground" aria-hidden />
                <input
                  type="search"
                  aria-label="Search courses"
                  placeholder="Search course title…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-admin-fg outline-none placeholder:text-admin-muted"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>
            </div>

            <div
              ref={listRef}
              className="custom-scrollbar max-h-56 overflow-y-auto overscroll-contain p-1.5"
            >
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => handleSelect(null)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                  !value
                    ? "bg-admin-primary/10 font-semibold text-admin-primary"
                    : "text-admin-fg hover:bg-admin-muted/10"
                }`}
              >
                <span>All courses</span>
                {!value && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>

              {loading && accumulated.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-admin-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading courses…
                </div>
              ) : error && accumulated.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-2 text-xs font-semibold text-admin-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : accumulated.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-admin-muted-foreground">
                  No courses found.
                </p>
              ) : (
                accumulated.map((course) => {
                  const selected = course.id === value;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleSelect(course)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "bg-admin-primary/10"
                          : "hover:bg-admin-muted/10"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-1">
                        <p
                          className={`min-w-0 truncate text-[13px] ${selected ? "font-semibold text-admin-primary" : "font-medium text-admin-fg"}`}
                          title={course.title}
                        >
                          {course.title}
                        </p>
                        <CourseStatusBadge status={course.status} />
                      </div>
                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-admin-primary" aria-hidden />
                      )}
                    </button>
                  );
                })
              )}

              {loading && accumulated.length > 0 && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-admin-muted-foreground" aria-hidden />
                </div>
              )}
            </div>

            {(canLoadMore || meta) && (
              <div className="border-t border-admin-border bg-admin-bg/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-admin-muted-foreground">
                  <span>
                    {accumulated.length} of {meta?.total ?? accumulated.length} shown
                  </span>
                  {canLoadMore && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="font-semibold text-admin-primary hover:underline"
                    >
                      Load more
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
