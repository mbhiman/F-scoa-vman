import { ArrowLeft, Award, ClipboardList, BookOpen, Phone, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default async function LearnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const learner = { name: "Rahul Verma", id }; // Mock

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/learners" className="flex items-center gap-2 text-sm text-admin-muted hover:text-admin-fg transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Learners
      </Link>

      <div className="rounded-xl border border-admin-border p-6 bg-admin-card shadow-admin-card">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full flex-center text-xl font-bold text-white bg-admin-primary">
            {learner.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-admin-fg">{learner.name}</h1>
                <p className="text-sm mt-0.5 font-mono text-admin-muted">{learner.id}</p>
              </div>
              <span className="badge-success bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            {/* Contacts Row */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-admin-muted"><Phone className="w-4 h-4" /> +91 98000 12345</div>
              <div className="flex items-center gap-2 text-sm text-admin-muted"><Mail className="w-4 h-4" /> rahul@example.com</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-admin-border bg-admin-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-admin-border">
            <ClipboardList className="w-4 h-4 text-admin-primary" />
            <h3 className="text-sm font-semibold text-admin-fg">Exam Attempts</h3>
          </div>
          <div className="p-5 space-y-3">
            {/* Map attempts here using border-admin-border and text-admin-fg */}
          </div>
        </section>

        <section className="rounded-xl border border-admin-border bg-admin-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-admin-primary" />
              <h3 className="text-sm font-semibold text-admin-fg">Certificates</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-sm font-medium text-emerald-600">Supply Chain 101</p>
              <button className="text-xs font-medium px-3 py-1.5 rounded-md text-white bg-emerald-500">Download</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}