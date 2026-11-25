import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const escape = value => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const time = value => Number.isFinite(value) ? new Date(value).toISOString() : '—';
export function renderDemoReview(records) {
  const rows = records.map(row => typeof row.payload === 'string' ? JSON.parse(row.payload) : row);
  const sorted = rows.sort((a, b) => b.createdAt - a.createdAt);
  const count = state => rows.filter(row => row.phase === state).length;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Demo booking review</title>
  <style>body{font:16px/1.5 system-ui;margin:2rem;color:#172534;background:#f4f7f6}main{max-width:100rem;margin:auto}article{background:white;border:1px solid #c5d1ce;border-radius:.6rem;padding:1.3rem;margin:1rem 0}dl{display:grid;grid-template-columns:12rem 1fr;gap:.4rem}dt{font-weight:600}dd{margin:0;overflow-wrap:anywhere}.summary{font-size:1.2rem}.warning{color:#8b3900}@media(max-width:600px){body{margin:1rem}dl{grid-template-columns:1fr}dd{margin-bottom:.5rem}}</style></head><body><main>
  <h1>Demo booking review</h1><p>Private snapshot generated ${escape(new Date().toISOString())}. This file contains customer information; keep it in the approved private location. It makes no network requests and changes no bookings.</p>
  <p class="summary">${rows.length} records · ${count('cancelled')} cancelled · ${count('cancel_sent')} cancellations awaiting confirmation · ${count('review')} needing attention</p>
  <p>Check “awaiting confirmation” and “review” first. For a mistaken confirmed cancellation, contact the person through your normal process and offer a new demo time. This report cannot restore a cancelled appointment.</p>
  ${sorted.map(row => `<article><h2>${escape(row.email)}</h2><p class="${['review','cancel_sent'].includes(row.phase) ? 'warning' : ''}"><strong>${escape(row.phase)}</strong> · ${escape(row.outcome)}</p><dl>${Object.entries({
    'Scheduled demo': time(row.evidence?.startAt), 'Visitor requested': row.correction || 'No cancellation',
    'Visitor confirmed at': time(row.confirmedAt), 'Cancellation observed': time(row.cancelObservedAt),
    'Provider cancellation time': time(row.evidence?.canceledAt), 'Reason for attention': row.reason,
    'Booking report to Bento': row.report || (row.verifiedAt ? 'Not yet sent' : 'Not verified'),
    'Cancellation report to Bento': row.cancellationReport || (row.outcome === 'confirmed' ? 'Not yet sent' : 'Not applicable'),
    'Booking reference': row.eventUri, 'Invitee reference': row.inviteeUri, 'Internal reference': row.id,
  }).map(([key,value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl></article>`).join('')}
  </main></body></html>`;
}
export function extractRows(value) {
  if (!Array.isArray(value)) throw new Error('Expected a JSON array');
  return value.flatMap(item => Array.isArray(item.results) ? item.results : [item]);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , source, destination] = process.argv;
  if (!source || !destination) throw new Error('Usage: node scripts/demo-review.mjs private-export.json private-report.html');
  await writeFile(destination, renderDemoReview(extractRows(JSON.parse(await readFile(source, 'utf8')))), { flag: 'wx', mode: 0o600 });
  console.log('Private report created. Do not upload it to the public website.');
}
