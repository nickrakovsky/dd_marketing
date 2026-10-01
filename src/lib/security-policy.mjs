// These directives protect framing, base URLs and plugin content without
// blocking the existing booking, analytics or critical-CSS loaders.
export const CONTENT_SECURITY_POLICY = "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests";

// Diagnostic only: inline scripts must be externalized or individually hashed
// before this can become an enforced script policy. Do not add unsafe-inline
// or unsafe-eval just to silence the reports.
export const SCRIPT_POLICY_REPORT_ONLY = "script-src 'self' https://fast.bentonow.com https://app.bentonow.com https://assets.calendly.com https://sc.lfeeder.com; script-src-attr 'none'; object-src 'none'; base-uri 'self'";
