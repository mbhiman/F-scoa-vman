// app/admin/layout.tsx
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopNav } from "@/components/layout/admin-topnav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-admin-bg text-admin-fg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopNav />
        <main className="flex-1 overflow-y-auto p-6 bg-admin-bg">
          {children}
        </main>
      </div>
    </div>
  );
}