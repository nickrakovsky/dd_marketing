import type { MetricRow, Month, SourceId, SyncStatus } from './types';
import { SOURCES } from './sources';

/**
 * Deterministic sample data so the dashboard can be built and reviewed
 * before any connector is live. Delete once every source syncs to D1.
 *
 * The numbers are shaped to be plausible, not real: paid channels drive
 * demos in proportion to spend, with a LinkedIn push and a ChatGPT Ads
 * launch so cause and effect is visible when testing the UI.
 */

const MONTHS_OF_HISTORY = 18;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function monthKey(d: Date): Month {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function lastMonths(count: number, now = new Date()): Month[] {
  const out: Month[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return out;
}

export function buildMockData(now = new Date()): { rows: MetricRow[]; sync: SyncStatus[] } {
  const rand = mulberry32(20260926);
  const jitter = (spread = 0.15) => 1 + (rand() * 2 - 1) * spread;
  const months = lastMonths(MONTHS_OF_HISTORY, now);
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const rows: MetricRow[] = [];

  const put = (month: Month, source: SourceId, metric: string, value: number, dimension = '') => {
    rows.push({ month, source, metric, dimension, value: Math.max(0, Math.round(value * 100) / 100) });
  };

  months.forEach((month, i) => {
    // The current month is partial: scale everything to days elapsed.
    const partial = i === months.length - 1 ? now.getUTCDate() / daysInMonth : 1;
    const growth = 1 + i * 0.025;
    const s = (n: number, spread?: number) => n * growth * partial * jitter(spread);

    const linkedInPush = i >= 9 && i <= 11 ? 2.2 : 1;
    const chatGptLive = i >= 10;

    const ads: Record<string, { spend: number; cpc: number; ctr: number; cvr: number }> = {
      google_ads: { spend: s(6200), cpc: 7.8, ctr: 0.041, cvr: 0.055 },
      microsoft_ads: { spend: s(1400), cpc: 5.1, ctr: 0.033, cvr: 0.048 },
      linkedin_ads: { spend: s(3100) * linkedInPush, cpc: 11.5, ctr: 0.0065, cvr: 0.09 },
      chatgpt_ads: { spend: chatGptLive ? s(900 + (i - 10) * 250) : 0, cpc: 4.2, ctr: 0.018, cvr: 0.035 },
    };

    const conversions: Record<string, number> = {};
    for (const [source, a] of Object.entries(ads)) {
      if (a.spend === 0) continue;
      const clicks = (a.spend / a.cpc) * jitter(0.08);
      conversions[source] = clicks * a.cvr * jitter(0.2);
      put(month, source as SourceId, 'spend', a.spend);
      put(month, source as SourceId, 'clicks', clicks);
      put(month, source as SourceId, 'impressions', clicks / a.ctr);
      put(month, source as SourceId, 'conversions', conversions[source]);
    }

    const gscClicks = s(4100);
    const gscImpr = gscClicks / (0.021 * jitter(0.1));
    put(month, 'google_search_console', 'clicks', gscClicks);
    put(month, 'google_search_console', 'impressions', gscImpr);
    put(month, 'google_search_console', 'position_weighted', gscImpr * (18.5 - i * 0.35) * jitter(0.05));

    const bingClicks = s(640);
    put(month, 'bing_webmaster', 'clicks', bingClicks);
    put(month, 'bing_webmaster', 'impressions', bingClicks / (0.028 * jitter(0.1)));

    const views = s(2300, 0.3);
    put(month, 'youtube', 'views', views);
    put(month, 'youtube', 'watch_hours', views * 0.071);
    put(month, 'youtube', 'subscribers_gained', views * 0.012);

    const campaigns = partial < 1 ? 2 : 3 + Math.round(rand() * 2);
    const sends = campaigns * 3800 * growth;
    put(month, 'email', 'campaigns', campaigns);
    put(month, 'email', 'sends', sends);
    put(month, 'email', 'opens', sends * 0.34 * jitter(0.1));
    put(month, 'email', 'clicks', sends * 0.031 * jitter(0.2));

    put(month, 'blog', 'posts_published', Math.round((partial < 1 ? 5 : 8) * jitter(0.35)));
    put(month, 'blog', 'organic_clicks', gscClicks * 0.62);

    // Demos: paid channels convert from their conversions, the rest from reach.
    const demos: Record<string, number> = {
      google_ads: (conversions.google_ads ?? 0) * 0.55,
      microsoft_ads: (conversions.microsoft_ads ?? 0) * 0.5,
      linkedin_ads: (conversions.linkedin_ads ?? 0) * 0.42,
      chatgpt_ads: (conversions.chatgpt_ads ?? 0) * 0.6,
      organic_search: (gscClicks + bingClicks) * 0.0024,
      ai_answers: (2 + i * 0.45) * partial * jitter(0.3),
      referral: 3 * growth * partial * jitter(0.4),
      email: sends * 0.0006,
      youtube: views * 0.0012,
      direct: 4 * growth * partial * jitter(0.4),
    };
    let total = 0;
    for (const [channel, value] of Object.entries(demos)) {
      const n = Math.round(value);
      if (n === 0) continue;
      total += n;
      put(month, 'calendly', 'demos_booked', n, channel);
    }
    put(month, 'calendly', 'demos_booked', total);
  });

  const syncedAt = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const sync: SyncStatus[] = SOURCES.map((s) => ({ source: s.id, lastSuccessAt: syncedAt, lastError: null }));

  return { rows, sync };
}
