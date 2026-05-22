import { Plus } from "lucide-react";

interface WizardHeaderProps {
  isEdit: boolean;
  isCreate: boolean;
  courseId: string | null;
  onReset: () => void;
}

export function WizardHeader({ isEdit, isCreate, courseId, onReset }: WizardHeaderProps) {
  const subtitle = isEdit
    ? `Edit course · ${courseId?.substring(0, 8)}...`
    : isCreate
      ? "Create a new course — complete each step in order."
      : "Design and publish a new course curriculum.";

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-admin-fg tracking-tight">
          {isEdit ? "Edit Course" : "Create Course"}
        </h1>
        <p className="mt-2 text-sm text-admin-muted-foreground">{subtitle}</p>
      </div>
      {isCreate && courseId && (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg font-medium transition-all px-5 py-2.5 border border-admin-border bg-transparent text-admin-fg hover:bg-admin-muted/30 active:scale-95"
          onClick={onReset}
        >
          <Plus className="w-4 h-4 mr-2" /> Start Fresh
        </button>
      )}
    </div>
  );
}
