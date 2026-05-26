import { redirect } from "next/navigation";

export default async function AdminStudentRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/learners/${id}`);
}
