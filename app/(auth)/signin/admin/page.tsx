import AuthPageShell from "@/components/auth/auth-page-shell";
import AdminLoginForm from "../../../../components/auth/forms/admin-login-form";

export default function AdminLoginPage() {
  return (
    <AuthPageShell
      variant="regular"
      title="Admin sign in"
      subtitle="Sign in to manage SCOA"
      portalLabel="Admin Portal"
    >
      <AdminLoginForm />
    </AuthPageShell>
  );
}