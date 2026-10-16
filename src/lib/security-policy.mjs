// Foundation applies to every response. Document script hashes are inserted
// into the compiled Worker from reviewed build artifacts, with no runtime hashing.
export const CONTENT_SECURITY_POLICY = "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src-attr 'none'; upgrade-insecure-requests";

const serialized = '__DD_BUILD_SCRIPT_CSP__';
export const BUILD_SCRIPT_POLICY = serialized.startsWith('script-src ') ? serialized : '';

// Diagnostic only: inline scripts must be externalized or individually hashed
// before this can become an enforced script policy. Do not add unsafe-inline
// or unsafe-eval just to silence the reports.
export const SCRIPT_POLICY_REPORT_ONLY = "script-src 'self' https://fast.bentonow.com https://app.bentonow.com https://assets.calendly.com https://sc.lfeeder.com; script-src-attr 'none'; object-src 'none'; base-uri 'self'";
