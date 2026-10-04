import type { SourceId } from './types';

/**
 * Registry of every marketing data source on the dashboard.
 *
 * `metrics` lists the raw values each connector writes to D1.
 * `columns` lists what the dashboard table shows; derived columns are
 * computed from raw metrics so they stay correct across multi-month ranges.
 */

export type Format = 'number' | 'currency' | 'percent' | 'decimal' | 'hours';

/** Sum of raw metric values for one source over one or more months. */
export type Totals = Record<string, number | undefined>;

export interface Column {
  key: string;
  label: string;
  format: Format;
  /** Returns undefined when there is no data to show. */
  value: (t: Totals) => number | undefined;
}

export interface SourceDef {
  id: SourceId;
  label: string;
  group: 'Paid' | 'Organic' | 'Owned' | 'Demos';
  /** Raw metrics this source's connector writes. */
  metrics: string[];
  columns: Column[];
}

const raw = (key: string, label: string, format: Format = 'number'): Column => ({
  key,
  label,
  format,
  value: (t) => t[key],
});

const ratio = (key: string, label: string, num: string, den: string, format: Format): Column => ({
  key,
  label,
  format,
  value: (t) => {
    const n = t[num];
    const d = t[den];
    return n === undefined || !d ? undefined : n / d;
  },
});

const adColumns = (conversionLabel = 'Conversions'): Column[] => [
  raw('spend', 'Spend', 'currency'),
  raw('impressions', 'Impr.'),
  raw('clicks', 'Clicks'),
  ratio('cpc', 'CPC', 'spend', 'clicks', 'currency'),
  raw('conversions', conversionLabel),
];

const adMetrics = ['spend', 'impressions', 'clicks', 'conversions'];

export const SOURCES: SourceDef[] = [
  { id: 'google_ads', label: 'Google Ads', group: 'Paid', metrics: adMetrics, columns: adColumns() },
  { id: 'microsoft_ads', label: 'Microsoft Ads', group: 'Paid', metrics: adMetrics, columns: adColumns() },
  { id: 'linkedin_ads', label: 'LinkedIn Ads', group: 'Paid', metrics: adMetrics, columns: adColumns('Leads') },
  { id: 'chatgpt_ads', label: 'ChatGPT Ads', group: 'Paid', metrics: adMetrics, columns: adColumns() },
  {
    id: 'google_search_console',
    label: 'Google Search',
    group: 'Organic',
    // position_weighted = sum(position * impressions); divided back out for display.
    metrics: ['clicks', 'impressions', 'position_weighted'],
    columns: [
      raw('clicks', 'Clicks'),
      raw('impressions', 'Impr.'),
      ratio('ctr', 'CTR', 'clicks', 'impressions', 'percent'),
      ratio('position', 'Avg pos.', 'position_weighted', 'impressions', 'decimal'),
    ],
  },
  {
    id: 'bing_webmaster',
    label: 'Bing Search',
    group: 'Organic',
    metrics: ['clicks', 'impressions'],
    columns: [
      raw('clicks', 'Clicks'),
      raw('impressions', 'Impr.'),
      ratio('ctr', 'CTR', 'clicks', 'impressions', 'percent'),
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    group: 'Organic',
    metrics: ['views', 'watch_hours', 'subscribers_gained'],
    columns: [
      raw('views', 'Views'),
      raw('watch_hours', 'Watch hrs', 'hours'),
      raw('subscribers_gained', 'Subs +'),
    ],
  },
  {
    id: 'email',
    label: 'Email',
    group: 'Owned',
    metrics: ['campaigns', 'sends', 'opens', 'clicks'],
    columns: [
      raw('campaigns', 'Campaigns'),
      raw('sends', 'Sends'),
      ratio('open_rate', 'Open rate', 'opens', 'sends', 'percent'),
      ratio('click_rate', 'Click rate', 'clicks', 'sends', 'percent'),
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    group: 'Owned',
    // organic_clicks = Search Console clicks on /posts/* pages.
    metrics: ['posts_published', 'organic_clicks'],
    columns: [raw('posts_published', 'Posts'), raw('organic_clicks', 'Search clicks')],
  },
  {
    id: 'calendly',
    label: 'Calendly',
    group: 'Demos',
    // demos_booked is written once with dimension '' (total) and once per channel.
    metrics: ['demos_booked'],
    columns: [raw('demos_booked', 'Demos booked')],
  },
];

export const METRIC_SOURCES = SOURCES.filter((s) => s.id !== 'calendly');

export const PAID_SOURCES: SourceId[] = ['google_ads', 'microsoft_ads', 'linkedin_ads', 'chatgpt_ads'];

/**
 * Channels a booked demo can be attributed to, from Calendly's UTM fields.
 * The sync worker maps utm_source/utm_medium onto these keys
 * (mapUtmToChannel in workers/marketing-sync/src/connectors/calendly.ts).
 */
export const DEMO_CHANNELS: { key: string; label: string; spendSource?: SourceId }[] = [
  { key: 'google_ads', label: 'Google Ads', spendSource: 'google_ads' },
  { key: 'microsoft_ads', label: 'Microsoft Ads', spendSource: 'microsoft_ads' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', spendSource: 'linkedin_ads' },
  { key: 'chatgpt_ads', label: 'ChatGPT Ads', spendSource: 'chatgpt_ads' },
  { key: 'organic_search', label: 'Organic search' },
  { key: 'ai_answers', label: 'AI answers (organic)' },
  { key: 'email', label: 'Email' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'referral', label: 'Referral' },
  { key: 'direct', label: 'Direct / unknown' },
];
