import Link from "next/link";

type LegalPageShellProps = {
    kicker: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
};

export default function LegalPageShell({
    kicker,
    title,
    subtitle,
    children,
}: LegalPageShellProps) {
    return (
        <div className="legal-shell">
            <div className="legal-container">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Link href="/signin/regular" className="legal-link text-sm">
                        ← Back to sign in
                    </Link>
                </div>

                <article className="legal-card">
                    <header className="legal-header">
                        <p className="legal-kicker">{kicker}</p>
                        <h1 className="legal-title">{title}</h1>
                        <p className="legal-subtitle">{subtitle}</p>
                    </header>

                    <div className="legal-body">{children}</div>
                </article>
            </div>
        </div>
    );
}