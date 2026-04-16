import Link from "next/link";

type PolicyConsentProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
};

export default function PolicyConsent({
    checked,
    onChange,
    error,
}: PolicyConsentProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className={`policy-consent ${error ? "border-red-500" : ""}`}>
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onChange(event.target.checked)}
                        className="policy-checkbox"
                    />

                    <span className="policy-consent-label">
                        I have read and agree to the{" "}
                        <Link
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </span>
                </label>
            </div>

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}