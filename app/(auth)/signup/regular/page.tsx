import AuthPageShell from "@/components/auth/auth-page-shell";
import RegularSignupForm from "@/components/auth/forms/regular-signup-form";

export default function RegularSignUpPage() {
  return (
    <AuthPageShell
      variant="regular"
      title="Join the program"
      subtitle="Create your regular learners account"
      portalLabel="Regular Learners Portal"
    >
      <RegularSignupForm />
    </AuthPageShell>
  );
}