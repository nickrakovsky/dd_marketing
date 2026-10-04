/** @jsxImportSource solid-js */
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import type { DashboardData, Month, SourceId } from '@/lib/marketing-dashboard/types';
import type { Format, SourceDef, Totals } from '@/lib/marketing-dashboard/sources';
import { DEMO_CHANNELS, METRIC_SOURCES, PAID_SOURCES, SOURCES } from '@/lib/marketing-dashboard/sources';
import { cn } from '@/components/solid/lib/utils';

type Props = { data: DashboardData };
type Preset = '3m' | '6m' | '12m' | 'ytd' | 'all';
type SortDir = 'asc' | 'desc';

const PRESETS: { id: Preset; label: string }[] = [
  { id: '3m', label: 'Last 3 months' },
  { id: '6m', label: 'Last 6 months' },
  { id: '12m', label: 'Last 12 months' },
  { id: 'ytd', label: 'Year to date' },
  { id: 'all', label: 'All' },
];

const GROUPS = ['Paid', 'Organic', 'Owned'] as const;

const monthLabel = (m: Month, short = false) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-US', {
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const cur0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const cur2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function fmt(v: number | undefined, format: Format): string {
  if (v === undefined || Number.isNaN(v)) return '-';
  switch (format) {
    case 'currency':
      return v < 100 ? cur2.format(v) : cur0.format(v);
    case 'percent':
      return `${nf1.format(v * 100)}%`;
    case 'decimal':
      return nf1.format(v);
    default:
      return nf0.format(v);
  }
}

function relativeTime(iso: string | null, now: number): string {
  if (!iso) return 'Never synced';
  const mins = Math.round((now - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

export default function MarketingDashboard(props: Props) {
  // ---------- Index raw rows ----------
  const index = createMemo(() => {
    const totals = new Map<string, Totals>(); // `${month}|${source}` -> metric totals (dimension '')
    const channels = new Map<Month, Record<string, number>>();
    const months = new Set<Month>();
    for (const r of props.data.rows) {
      months.add(r.month);
      if (r.dimension) {
        const c = channels.get(r.month) ?? {};
        c[r.dimension] = (c[r.dimension] ?? 0) + r.value;
        channels.set(r.month, c);
        continue;
      }
      const key = `${r.month}|${r.source}`;
      const t = totals.get(key) ?? {};
      t[r.metric] = (t[r.metric] ?? 0) + r.value;
      totals.set(key, t);
    }
    return { totals, channels, months: [...months].sort() };
  });

  const allMonths = () => index().months;
  const currentMonth = () => props.data.generatedAt.slice(0, 7);

  /** Sum a source's raw metrics over a set of months. Missing metrics stay undefined. */
  const sumTotals = (source: SourceId, months: Month[]): Totals => {
    const out: Totals = {};
    for (const m of months) {
      const t = index().totals.get(`${m}|${source}`);
      if (!t) continue;
      for (const [k, v] of Object.entries(t)) out[k] = (out[k] ?? 0) + (v ?? 0);
    }
    return out;
  };

  const demosFor = (months: Month[]) => sumTotals('calendly', months).demos_booked ?? 0;

  // ---------- Controls ----------
  const [preset, setPreset] = createSignal<Preset | null>('12m');
  const [from, setFrom] = createSignal<Month>('');
  const [to, setTo] = createSignal<Month>('');
  const [sort, setSort] = createSignal<{ key: string; dir: SortDir }>({ key: 'month', dir: 'desc' });
  const [hidden, setHidden] = createSignal<Set<SourceId>>(new Set());

  const applyPreset = (p: Preset) => {
    const months = allMonths();
    const last = months[months.length - 1] ?? '';
    let start = months[0] ?? '';
    if (p === '3m') start = months[Math.max(0, months.length - 3)];
    if (p === '6m') start = months[Math.max(0, months.length - 6)];
    if (p === '12m') start = months[Math.max(0, months.length - 12)];
    if (p === 'ytd') start = months.find((m) => m.startsWith(last.slice(0, 4))) ?? start;
    setPreset(p);
    setFrom(start);
    setTo(last);
  };
  applyPreset('12m');

  const rangeMonths = createMemo(() => allMonths().filter((m) => m >= from() && m <= to()));
  const previousMonths = createMemo(() => {
    const months = allMonths();
    const start = months.indexOf(rangeMonths()[0] ?? '');
    const len = rangeMonths().length;
    return start - len >= 0 ? months.slice(start - len, start) : [];
  });

  const visibleSources = createMemo(() => METRIC_SOURCES.filter((s) => !hidden().has(s.id)));
  const toggleSource = (id: SourceId) => {
    const next = new Set(hidden());
    next.has(id) ? next.delete(id) : next.add(id);
    setHidden(next);
  };
  const toggleGroup = (group: SourceDef['group']) => {
    const ids = METRIC_SOURCES.filter((s) => s.group === group).map((s) => s.id);
    const allHidden = ids.every((id) => hidden().has(id));
    const next = new Set(hidden());
    ids.forEach((id) => (allHidden ? next.delete(id) : next.add(id)));
    setHidden(next);
  };

  // ---------- Rows ----------
  const cellValue = (month: Month, sortKey: string): number | undefined => {
    if (sortKey === 'demos') return demosFor([month]);
    const [sourceId, colKey] = sortKey.split(':') as [SourceId, string];
    const source = SOURCES.find((s) => s.id === sourceId);
    const col = source?.columns.find((c) => c.key === colKey);
    return col?.value(sumTotals(sourceId, [month]));
  };

  const sortedMonths = createMemo(() => {
    const { key, dir } = sort();
    const sign = dir === 'asc' ? 1 : -1;
    const months = [...rangeMonths()];
    if (key === 'month') return months.sort((a, b) => a.localeCompare(b) * sign);
    return months.sort((a, b) => ((cellValue(a, key) ?? -Infinity) - (cellValue(b, key) ?? -Infinity)) * sign);
  });

  const toggleSort = (key: string) => {
    const s = sort();
    setSort(s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };
  const sortIcon = (key: string) => (sort().key !== key ? '' : sort().dir === 'asc' ? ' ↑' : ' ↓');
  const ariaSort = (key: string) =>
    sort().key !== key ? 'none' : sort().dir === 'asc' ? 'ascending' : 'descending';

  // Tooltip is fixed-positioned outside the scrolling table so it never clips.
  const [tip, setTip] = createSignal<{ month: Month; x: number; y: number } | null>(null);
  const showTip = (month: Month, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setTip({ month, x: r.left, y: r.top + r.height / 2 });
  };
  onMount(() => {
    const hide = () => setTip(null);
    window.addEventListener('scroll', hide, { passive: true });
    onCleanup(() => window.removeEventListener('scroll', hide));
  });
  const tipChannels = (month: Month) =>
    DEMO_CHANNELS.map((c) => ({ label: c.label, n: index().channels.get(month)?.[c.key] ?? 0 }))
      .filter((c) => c.n > 0)
      .sort((a, b) => b.n - a.n);

  const maxDemos = createMemo(() => Math.max(1, ...rangeMonths().map((m) => demosFor([m]))));

  // ---------- Summary ----------
  const summary = createMemo(() => {
    const months = rangeMonths();
    const prev = previousMonths();
    const demos = demosFor(months);
    const prevDemos = prev.length ? demosFor(prev) : undefined;
    const spend = PAID_SOURCES.reduce((sum, id) => sum + (sumTotals(id, months).spend ?? 0), 0);
    const paidDemos = PAID_SOURCES.reduce(
      (sum, id) => sum + months.reduce((s, m) => s + (index().channels.get(m)?.[id] ?? 0), 0),
      0,
    );
    const organicClicks =
      (sumTotals('google_search_console', months).clicks ?? 0) + (sumTotals('bing_webmaster', months).clicks ?? 0);
    return {
      demos,
      demosDelta: prevDemos ? (demos - prevDemos) / prevDemos : undefined,
      spend,
      costPerPaidDemo: paidDemos ? spend / paidDemos : undefined,
      organicClicks,
    };
  });

  const channelBreakdown = createMemo(() => {
    const months = rangeMonths();
    const rows = DEMO_CHANNELS.map((c) => {
      const demos = months.reduce((s, m) => s + (index().channels.get(m)?.[c.key] ?? 0), 0);
      const spend = c.spendSource ? sumTotals(c.spendSource, months).spend : undefined;
      return { ...c, demos, spend, cpd: spend !== undefined && demos ? spend / demos : undefined };
    }).filter((r) => r.demos > 0 || (r.spend ?? 0) > 0);
    const max = Math.max(1, ...rows.map((r) => r.demos));
    return { rows: rows.sort((a, b) => b.demos - a.demos), max };
  });

  const now = new Date(props.data.generatedAt).getTime();
  const rangeLabel = () => {
    const m = rangeMonths();
    if (!m.length) return 'No data';
    return m.length === 1 ? monthLabel(m[0]) : `${monthLabel(m[0], true)} to ${monthLabel(m[m.length - 1], true)}`;
  };

  // ---------- Render ----------
  return (
    <div class="space-y-6">
      {/* Controls */}
      <section aria-label="Filters" class="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg border border-black/10 bg-white p-4">
        <div>
          <p class="mb-1.5 text-xs font-medium text-black/60">Time frame</p>
          <div class="flex flex-wrap gap-1" role="group" aria-label="Time frame presets">
            <For each={PRESETS}>
              {(p) => (
                <button
                  type="button"
                  aria-pressed={preset() === p.id}
                  onClick={() => applyPreset(p.id)}
                  class={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    preset() === p.id
                      ? 'border-black bg-black text-white'
                      : 'border-black/15 bg-white text-black hover:border-black/40',
                  )}
                >
                  {p.label}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex items-end gap-2">
          <label class="text-xs font-medium text-black/60">
            From
            <select
              class="mt-1.5 block rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm text-black"
              value={from()}
              onChange={(e) => {
                setPreset(null);
                setFrom(e.currentTarget.value);
                if (e.currentTarget.value > to()) setTo(e.currentTarget.value);
              }}
            >
              <For each={allMonths()}>{(m) => <option value={m} selected={m === from()}>{monthLabel(m, true)}</option>}</For>
            </select>
          </label>
          <label class="text-xs font-medium text-black/60">
            To
            <select
              class="mt-1.5 block rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm text-black"
              value={to()}
              onChange={(e) => {
                setPreset(null);
                setTo(e.currentTarget.value);
                if (e.currentTarget.value < from()) setFrom(e.currentTarget.value);
              }}
            >
              <For each={allMonths()}>{(m) => <option value={m} selected={m === to()}>{monthLabel(m, true)}</option>}</For>
            </select>
          </label>
        </div>

        <div class="min-w-0 flex-1 basis-full xl:basis-0">
          <p class="mb-1.5 text-xs font-medium text-black/60">Sources shown</p>
          <div class="flex flex-wrap items-center gap-1.5">
            <For each={GROUPS}>
              {(group) => (
                <>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    class="px-1 text-xs font-semibold uppercase tracking-wide text-black/50 hover:text-black"
                    title={`Toggle all ${group.toLowerCase()} sources`}
                  >
                    {group}
                  </button>
                  <For each={METRIC_SOURCES.filter((s) => s.group === group)}>
                    {(s) => (
                      <button
                        type="button"
                        aria-pressed={!hidden().has(s.id)}
                        onClick={() => toggleSource(s.id)}
                        class={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          hidden().has(s.id)
                            ? 'border-dashed border-black/20 bg-transparent text-black/40'
                            : 'border-black/15 bg-[#FFF8EE] text-black',
                        )}
                      >
                        {s.label}
                      </button>
                    )}
                  </For>
                  <span class="mx-1 h-4 w-px bg-black/10 last:hidden" aria-hidden="true" />
                </>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Summary tiles */}
      <section aria-label={`Summary for ${rangeLabel()}`} class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="col-span-2 rounded-lg border border-black/10 bg-white p-4 lg:col-span-1">
          <p class="text-sm text-black/60">Demos booked</p>
          <p class="mt-1 text-5xl font-semibold tracking-tight text-black">{nf0.format(summary().demos)}</p>
          <p class="mt-1 text-xs text-black/60">
            <Show when={summary().demosDelta !== undefined} fallback={rangeLabel()}>
              <span class={summary().demosDelta! >= 0 ? 'font-medium text-[#1a7f37]' : 'font-medium text-[#c62828]'}>
                {summary().demosDelta! >= 0 ? '▲' : '▼'} {nf1.format(Math.abs(summary().demosDelta! * 100))}%
              </span>{' '}
              vs previous {rangeMonths().length} {rangeMonths().length === 1 ? 'month' : 'months'}
            </Show>
          </p>
        </div>
        <div class="rounded-lg border border-black/10 bg-white p-4">
          <p class="text-sm text-black/60">Ad spend</p>
          <p class="mt-1 text-3xl font-semibold tracking-tight text-black">{cur0.format(summary().spend)}</p>
          <p class="mt-1 text-xs text-black/60">Google, Microsoft, LinkedIn, ChatGPT</p>
        </div>
        <div class="rounded-lg border border-black/10 bg-white p-4">
          <p class="text-sm text-black/60">Cost per paid demo</p>
          <p class="mt-1 text-3xl font-semibold tracking-tight text-black">{fmt(summary().costPerPaidDemo, 'currency')}</p>
          <p class="mt-1 text-xs text-black/60">Ad spend / demos from paid UTMs</p>
        </div>
        <div class="col-span-2 rounded-lg border border-black/10 bg-white p-4 lg:col-span-1">
          <p class="text-sm text-black/60">Organic search clicks</p>
          <p class="mt-1 text-3xl font-semibold tracking-tight text-black">{compact.format(summary().organicClicks)}</p>
          <p class="mt-1 text-xs text-black/60">Google + Bing</p>
        </div>
      </section>

      {/* Month table: activity on the left, demos pinned on the right */}
      <section aria-labelledby="by-month" class="rounded-lg border border-black/10 bg-white">
        <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-4 py-3">
          <h2 id="by-month" class="text-base font-semibold text-black">
            Marketing activity and demos by month
          </h2>
          <p class="text-xs text-black/60">{rangeLabel()} · Click any column header to sort</p>
        </div>
        <div class="overflow-x-auto" onScroll={() => setTip(null)}>
          <table class="w-full border-separate border-spacing-0 text-sm tabular-nums">
            <thead>
              <tr class="text-left text-xs text-black/60">
                <th
                  rowSpan={2}
                  aria-sort={ariaSort('month')}
                  class="sticky left-0 z-20 border-b border-r border-black/10 bg-white px-4 py-2 align-bottom font-medium"
                >
                  <button type="button" onClick={() => toggleSort('month')} class="font-semibold text-black hover:underline">
                    Month{sortIcon('month')}
                  </button>
                </th>
                <For each={visibleSources()}>
                  {(s) => (
                    <th
                      colSpan={s.columns.length}
                      class="whitespace-nowrap border-b border-l border-black/10 bg-[#FFF8EE] px-3 py-1.5 font-semibold text-black"
                    >
                      {s.label}
                    </th>
                  )}
                </For>
                <th
                  rowSpan={2}
                  aria-sort={ariaSort('demos')}
                  class="z-20 min-w-[15rem] border-b border-l-2 border-black/15 bg-[#FFF8EE] px-4 py-2 align-bottom md:sticky md:right-0"
                >
                  <button type="button" onClick={() => toggleSort('demos')} class="font-semibold text-black hover:underline">
                    Demos booked{sortIcon('demos')}
                  </button>
                </th>
              </tr>
              <tr class="text-right text-xs text-black/60">
                <For each={visibleSources()}>
                  {(s) => (
                    <For each={s.columns}>
                      {(c, i) => {
                        const key = `${s.id}:${c.key}`;
                        return (
                          <th
                            aria-sort={ariaSort(key)}
                            class={cn('whitespace-nowrap border-b border-black/10 px-3 py-1.5 font-medium', i() === 0 && 'border-l')}
                          >
                            <button type="button" onClick={() => toggleSort(key)} class="hover:text-black hover:underline">
                              {c.label}
                              {sortIcon(key)}
                            </button>
                          </th>
                        );
                      }}
                    </For>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={sortedMonths()}>
                {(month) => {
                  const demos = () => demosFor([month]);
                  const partial = month === currentMonth();
                  return (
                    <tr class="group">
                      <th
                        scope="row"
                        class="sticky left-0 z-10 whitespace-nowrap border-b border-r border-black/10 bg-white px-4 py-2.5 text-left font-medium text-black group-hover:bg-[#FFF8EE]"
                      >
                        {monthLabel(month, true)}
                        <Show when={partial}>
                          <span class="ml-1.5 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-normal uppercase text-black/60">MTD</span>
                        </Show>
                      </th>
                      <For each={visibleSources()}>
                        {(s) => {
                          const t = () => sumTotals(s.id, [month]);
                          return (
                            <For each={s.columns}>
                              {(c, i) => (
                                <td
                                  class={cn(
                                    'whitespace-nowrap border-b border-black/10 px-3 py-2.5 text-right text-black group-hover:bg-[#FFF8EE]',
                                    i() === 0 && 'border-l',
                                    c.value(t()) === undefined && 'text-black/30',
                                  )}
                                >
                                  {fmt(c.value(t()), c.format)}
                                </td>
                              )}
                            </For>
                          );
                        }}
                      </For>
                      <td class="z-10 border-b border-l-2 border-black/10 border-l-black/15 bg-white px-4 py-2 group-hover:bg-[#FFF8EE] md:sticky md:right-0">
                        <div
                          class="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-black"
                          tabIndex={0}
                          aria-label={`${demos()} demos booked in ${monthLabel(month)}`}
                          onMouseEnter={(e) => showTip(month, e.currentTarget)}
                          onFocus={(e) => showTip(month, e.currentTarget)}
                          onMouseLeave={() => setTip(null)}
                          onBlur={() => setTip(null)}
                        >
                          <div class="h-3.5 flex-1">
                            <div
                              class="h-full rounded-r bg-[#FE5000]"
                              style={{ width: `${(demos() / maxDemos()) * 100}%` }}
                            />
                          </div>
                          <span class="w-8 text-right font-semibold text-black">{nf0.format(demos())}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
            <tfoot>
              <tr class="font-semibold">
                <th scope="row" class="sticky left-0 z-10 border-r border-black/10 bg-[#FFF8EE] px-4 py-2.5 text-left text-black">
                  Total
                </th>
                <For each={visibleSources()}>
                  {(s) => {
                    const t = () => sumTotals(s.id, rangeMonths());
                    return (
                      <For each={s.columns}>
                        {(c, i) => (
                          <td class={cn('whitespace-nowrap bg-[#FFF8EE] px-3 py-2.5 text-right text-black', i() === 0 && 'border-l border-black/10')}>
                            {fmt(c.value(t()), c.format)}
                          </td>
                        )}
                      </For>
                    );
                  }}
                </For>
                <td class="z-10 border-l-2 border-black/15 bg-[#FFF8EE] px-4 py-2.5 text-right text-black md:sticky md:right-0">
                  {nf0.format(summary().demos)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <Show when={tip()}>
        {(t) => (
          <div
            role="tooltip"
            class="pointer-events-none fixed z-50 w-52 -translate-x-full -translate-y-1/2 rounded-md border border-black/10 bg-white p-3 text-xs shadow-lg"
            style={{ left: `${t().x - 8}px`, top: `${t().y}px` }}
          >
            <p class="mb-1.5 font-semibold text-black">
              {monthLabel(t().month)}
              {t().month === currentMonth() ? ' (to date)' : ''}
            </p>
            <For each={tipChannels(t().month)}>
              {(c) => (
                <p class="flex justify-between text-black/70">
                  <span>{c.label}</span>
                  <span class="font-medium text-black">{c.n}</span>
                </p>
              )}
            </For>
          </div>
        )}
      </Show>

      <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Demos by channel */}
        <section aria-labelledby="by-channel" class="rounded-lg border border-black/10 bg-white">
          <div class="border-b border-black/10 px-4 py-3">
            <h2 id="by-channel" class="text-base font-semibold text-black">Demos by channel</h2>
            <p class="text-xs text-black/60">From Calendly UTM fields · {rangeLabel()}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm tabular-nums">
              <thead>
                <tr class="text-xs text-black/60">
                  <th class="px-4 py-2 text-left font-medium">Channel</th>
                  <th class="w-2/5 px-2 py-2 text-left font-medium">Demos</th>
                  <th class="px-3 py-2 text-right font-medium">Spend</th>
                  <th class="px-4 py-2 text-right font-medium">Cost per demo</th>
                </tr>
              </thead>
              <tbody>
                <For each={channelBreakdown().rows}>
                  {(r) => (
                    <tr class="border-t border-black/10">
                      <th scope="row" class="whitespace-nowrap px-4 py-2 text-left font-medium text-black">{r.label}</th>
                      <td class="px-2 py-2">
                        <div class="flex items-center gap-2">
                          <div class="h-3.5 flex-1">
                            <div class="h-full rounded-r bg-[#FE5000]" style={{ width: `${(r.demos / channelBreakdown().max) * 100}%` }} />
                          </div>
                          <span class="w-8 text-right font-semibold text-black">{nf0.format(r.demos)}</span>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 text-right text-black">{fmt(r.spend, 'currency')}</td>
                      <td class="whitespace-nowrap px-4 py-2 text-right text-black">{fmt(r.cpd, 'currency')}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </section>

        {/* Connection status */}
        <section aria-labelledby="sync-status" class="rounded-lg border border-black/10 bg-white">
          <div class="border-b border-black/10 px-4 py-3">
            <h2 id="sync-status" class="text-base font-semibold text-black">Connections</h2>
            <p class="text-xs text-black/60">Synced daily by the marketing-sync Worker</p>
          </div>
          <ul class="divide-y divide-black/10 text-sm">
            <For each={SOURCES}>
              {(s) => {
                const status = props.data.sync.find((x) => x.source === s.id);
                const state = status?.lastError ? 'error' : status?.lastSuccessAt ? 'ok' : 'none';
                return (
                  <li class="flex items-center justify-between gap-3 px-4 py-2">
                    <span class="flex items-center gap-2 text-black">
                      <span
                        aria-hidden="true"
                        class={cn(
                          'inline-block h-2 w-2 rounded-full',
                          state === 'ok' && 'bg-[#1a7f37]',
                          state === 'error' && 'bg-[#c62828]',
                          state === 'none' && 'bg-black/25',
                        )}
                      />
                      {s.label}
                    </span>
                    <span class={cn('text-xs', state === 'error' ? 'text-[#c62828]' : 'text-black/60')} title={status?.lastError ?? undefined}>
                      {state === 'error' ? 'Sync failing' : state === 'ok' ? 'OK · ' : ''}
                      {state !== 'error' ? relativeTime(status?.lastSuccessAt ?? null, now) : ''}
                    </span>
                  </li>
                );
              }}
            </For>
          </ul>
        </section>
      </div>
    </div>
  );
}
