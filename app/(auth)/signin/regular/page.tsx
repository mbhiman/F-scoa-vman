import AuthPageShell from "@/components/auth/auth-page-shell";
import RegularLoginForm from "@/components/auth/forms/regular-login-form";

export default function RegularSignInPage() {
    return (
        <AuthPageShell
            variant="regular"
            title="Welcome back"
            subtitle="Sign in to your SCOA learner portal"
            portalLabel="Regular Learner Portal"
        >
            <RegularLoginForm />
        </AuthPageShell>
    );
}