"use client";

import { Toaster } from "sonner";

/**
 * Toast host for admin routes only. Mount in app/admin/layout.tsx.
 */
export function AdminToaster() {
  return (
    <Toaster
      className="admin-sonner-toaster"
      closeButton
      expand
      gap={12}
      position="top-right"
      theme="system"
      duration={4000}
      offset={{ top: 72, right: 20 }}
      mobileOffset={{ top: 16, right: 12, left: 12 }}
      toastOptions={{
        unstyled: true,
      }}
    />
  );
}
