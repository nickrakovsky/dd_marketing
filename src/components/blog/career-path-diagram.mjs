// Preserve the original article's illustrative roles, estimates and routes.
export const roles = [
  { id: 'coordinator', lines: ['Logistics', 'Coordinator'], salary: '$44,000', x: 490, y: 18, width: 220, height: 84 },
  ...[
    ['inventory', ['Inventory', 'Controller'], '$50,000'],
    ['data', ['Data analyst'], '$70,000'],
    ['specialist', ['Logistics', 'Specialist'], '$70,000'],
    ['planner', ['Load planner'], '$70,000'],
  ].map(([id, lines, salary], i) => ({ id, lines, salary, x: 48 + i * 288, y: 160, width: 240, height: 84 })),
  ...[
    ['warehouse', ['Warehouse', 'Manager'], '$75,000'],
    ['procurement', ['Procurement', 'Manager'], '$98,000'],
    ['supply', ['Supply chain', 'Analyst'], '$101,000'],
    ['transport', ['Transportation', 'Manager'], '$85,000'],
    ['terminal', ['Terminal', 'Operations', 'Manager'], '$95,000'],
    ['freight', ['Freight', 'Broker'], '$89,000'],
    ['fleet', ['Fleet', 'Manager'], '$85,000'],
  ].map(([id, lines, salary], i) => ({ id, lines, salary, x: 25 + i * 166, y: 318, width: 150, height: 96 })),
  { id: 'senior', lines: ['Senior management'], salary: '$150,000+', x: 460, y: 484, width: 280, height: 84 },
];

export const routes = [
  ...['inventory', 'data', 'specialist', 'planner'].map(to => ['coordinator', to]),
  ['inventory', 'warehouse'], ['inventory', 'procurement'],
  ['data', 'procurement'], ['data', 'supply'], ['data', 'transport'],
  ['specialist', 'transport'], ['specialist', 'terminal'], ['specialist', 'freight'],
  ['planner', 'freight'], ['planner', 'fleet'],
  ...['warehouse', 'procurement', 'supply', 'transport', 'terminal', 'freight', 'fleet'].map(from => [from, 'senior']),
];

export const connectors = routes.map(([from, to]) => {
  const source = roles.find(role => role.id === from);
  const target = roles.find(role => role.id === to);
  const outgoing = routes.filter(route => route[0] === from);
  const incoming = routes.filter(route => route[1] === to);
  const outIndex = outgoing.findIndex(route => route[1] === to);
  const inIndex = incoming.findIndex(route => route[0] === from);
  let startX = source.x + source.width / 2 + (outIndex - (outgoing.length - 1) / 2) * 18;
  let endX = target.x + target.width / 2 + (inIndex - (incoming.length - 1) / 2) * 18;
  const startY = source.y + source.height;
  const endY = target.y;
  // Each branching role uses one shared stem and horizontal rail.
  if (outgoing.length > 1) startX = source.x + source.width / 2;
  if (Math.abs(startX - endX) < 4 || (incoming.length === 1 && Math.abs(startX - endX) < 25)) endX = startX;
  const laneY = from === 'coordinator' ? 130
    : to === 'senior' ? 428 + Math.abs(inIndex - 3) * 9
    : 258 + ['inventory', 'data', 'specialist', 'planner'].indexOf(from) * 14;
  return { from, to, startX, startY, endX, endY, d: startX === endX ? `M ${startX} ${startY} V ${endY}` : `M ${startX} ${startY} V ${laneY} H ${endX} V ${endY}` };
});

export function renderCareerDiagram(fontCSS = '') {
  const boxes = roles.map(role => {
    const center = role.x + role.width / 2;
    const fontSize = role.width === 150 ? 15 : 20;
    const lineHeight = role.width === 150 ? 18 : 21;
    const start = role.y + (role.lines.length === 1 ? 31 : role.lines.length === 3 ? 20 : 25);
    return `<g data-role="${role.id}"><rect x="${role.x}" y="${role.y}" width="${role.width}" height="${role.height}" rx="3"/><text class="role" style="font-size:${fontSize}px" x="${center}" y="${start}">${role.lines.map((line, i) => `<tspan x="${center}" dy="${i ? lineHeight : 0}">${line}</tspan>`).join('')}</text><text class="salary" x="${center}" y="${role.y + role.height - 14}">${role.salary}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="career-diagram" width="1200" height="582" viewBox="0 0 1200 582" role="img" aria-labelledby="career-diagram-title career-diagram-description">
<title id="career-diagram-title">Illustrative logistics coordinator career paths</title>
<desc id="career-diagram-description">Logistics coordinator branches into inventory controller, data analyst, logistics specialist and load planner roles. These branch into management and specialist positions, with routes into senior management. Salary estimates are retained from the original article.</desc>
<style>${fontCSS} .career-diagram .role{font:600 20px Inter,Arial,sans-serif;text-anchor:middle;fill:var(--career-ink,#302b25)}.career-diagram .salary{font:500 14px Inter,Arial,sans-serif;text-anchor:middle;fill:var(--career-muted,#61564a)}.career-diagram rect{fill:var(--career-paper,#fff8ee);stroke:var(--career-rule,#d8c6ae);stroke-width:1.5}.career-diagram .connector{fill:none;stroke:var(--career-muted,#61564a);stroke-width:1.6;stroke-linejoin:round}</style>
<defs><marker id="career-arrow" markerWidth="7" markerHeight="7" refX="7" refY="3.5" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#fe5000"/></marker></defs>
${connectors.map(edge => `<path class="connector" data-from="${edge.from}" data-to="${edge.to}" d="${edge.d}" marker-end="url(#career-arrow)"/>`).join('')}
${boxes}</svg>`;
}
