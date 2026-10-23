import schedule from '../../docs/daily-blog-schedule.json';

// Keep the local overview after the final scheduled article in the manifest.
// Only development-only page wrappers import it; publication helpers use real time.
export const DAILY_BLOG_PREVIEW_AS_OF = new Date(schedule.previewAsOf);
