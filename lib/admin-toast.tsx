"use client";

import { toast, type ExternalToast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

const toastShell =
  "relative flex w-full max-w-[min(calc(100vw-2rem),22rem)] items-center gap-3 rounded-xl border border-admin-border bg-admin-card px-3.5 py-3 pr-10 font-ui shadow-admin-card sm:max-w-[22rem]";

const titleClass =
  "text-[13px] font-semibold leading-snug tracking-tight text-admin-fg";

const closeButtonClass =
  "!absolute !top-1/2 !right-2.5 !left-auto !-translate-y-1/2 !transform-none !rounded-full !border !border-admin-border !bg-admin-bg !p-1 !text-admin-muted-foreground !shadow-none hover:!bg-admin-border/60 hover:!text-admin-fg";

const toastBase: ExternalToast = {
  unstyled: true,
};

function SuccessIcon() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-emerald-500/15"
      aria-hidden
    >
      <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </span>
  );
}

function ErrorIcon() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-500/15"
      aria-hidden
    >
      <XCircle className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </span>
  );
}

const successClassNames: NonNullable<ExternalToast["classNames"]> = {
  toast: `${toastShell} border-l-[3px] border-l-emerald-500`,
  title: titleClass,
  icon: "!m-0 shrink-0",
  closeButton: closeButtonClass,
};

const errorClassNames: NonNullable<ExternalToast["classNames"]> = {
  toast: `${toastShell} border-l-[3px] border-l-red-500`,
  title: titleClass,
  icon: "!m-0 shrink-0",
  closeButton: closeButtonClass,
};

/** Success feedback for admin course flows */
export function adminToastSuccess(message: string) {
  return toast.success(message, {
    ...toastBase,
    icon: <SuccessIcon />,
    classNames: successClassNames,
    duration: 4000,
  });
}

/** API / validation / action errors */
export function adminToastError(message: string | null | undefined) {
  const text = message?.trim();
  if (!text) return;
  return toast.error(text, {
    ...toastBase,
    icon: <ErrorIcon />,
    classNames: errorClassNames,
    duration: 5500,
  });
}
