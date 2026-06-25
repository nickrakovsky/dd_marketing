const fs = require('fs');

let content = fs.readFileSync('src/layouts/BlogPostLayout.astro', 'utf8');

// Fix trigger.cardEl
content = content.replace(/trigger\.cardEl/g, '(trigger as any).cardEl');
content = content.replace(/t\.cardEl/g, '(t as any).cardEl');

// Fix currentCardEl possibly undefined
content = content.replace(/if \(currentCardEl\.dataset\.smartlinkType/g, 'if (currentCardEl && currentCardEl.dataset.smartlinkType');
content = content.replace(/currentCardEl\.classList/g, 'currentCardEl?.classList');
content = content.replace(/currentCardEl\.dataset/g, 'currentCardEl?.dataset');
content = content.replace(/currentCardEl\.addEventListener/g, 'currentCardEl?.addEventListener');

// Fix closeSmartLinkUI
content = content.replace(/window\.closeSmartLinkUI/g, '(window as any).closeSmartLinkUI');

// Fix getPremiumCardHTML return type
content = content.replace(/function getPremiumCardHTML\(dataset: any, isInline: boolean = false\)/, 'function getPremiumCardHTML(dataset: any, isInline: boolean = false): string');

fs.writeFileSync('src/layouts/BlogPostLayout.astro', content);
