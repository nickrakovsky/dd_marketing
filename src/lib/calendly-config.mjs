// Single source of truth for the Calendly demo booking URL.
//
// If we ever rename or move the booking handle (e.g. switch from
// `nick-rakovsky/datadocks-demo` to a team scheduling page), update this
// constant only. The sitewide click interceptor in Layout.astro matches
// on the URL fragment `CALENDLY_BOOKING_FRAGMENT` so blog posts and any
// external content linking the old URL still get routed through the popup.
//
// Note: blog post MDX files reference the full URL inline (Markdown links)
// because they can't import this module at render time. Those continue to
// work via the interceptor, but if the handle changes you'll want to do a
// repo-wide find/replace on the blog post links too.

export const CALENDLY_BOOKING_URL = 'https://calendly.com/nick-rakovsky/datadocks-demo';
export const CALENDLY_BOOKING_FRAGMENT = 'calendly.com/nick-rakovsky/datadocks-demo';
export const CALENDLY_BRAND_PARAMS = 'primary_color=FF5722';
