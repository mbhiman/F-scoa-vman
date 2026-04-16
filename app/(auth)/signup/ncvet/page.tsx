import AuthPageShell from "@/components/auth/auth-page-shell";
import NcvetSignupForm from "@/components/auth/forms/ncvet-signup-form";

export default function NcvetSignUpPage() {
  return (
    <AuthPageShell
      variant="ncvet"
      title="Create your account"
      subtitle="Register as an NCVET Learners"
      portalLabel="NCVET Learners Portal"
    >
      <NcvetSignupForm />
    </AuthPageShell>
  );
}