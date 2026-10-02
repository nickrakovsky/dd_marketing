// Block inline event attributes while preserving the current script loaders.
// A full script-src policy still needs trusted inline hashes and a replacement
// for Partytown's eval-based vendor execution; this is not that final policy.
export const CONTENT_SECURITY_POLICY = "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src-attr 'none'; upgrade-insecure-requests";

// Diagnostic only: inline scripts must be externalized or individually hashed
// before this can become an enforced script policy. Do not add unsafe-inline
// or unsafe-eval just to silence the reports.
export const SCRIPT_POLICY_REPORT_ONLY = "script-src 'self' https://fast.bentonow.com https://app.bentonow.com https://assets.calendly.com https://sc.lfeeder.com; script-src-attr 'none'; object-src 'none'; base-uri 'self'";
