const fs = require('fs');

let content = fs.readFileSync('src/layouts/BlogPostLayout.astro', 'utf8');

// Fix currentCardEl optional chaining assignment
content = content.replace(/currentCardEl\?\.dataset/g, 'if (currentCardEl) currentCardEl.dataset');
content = content.replace(/if \(currentCardEl\) currentCardEl\.dataset\.hovered/g, 'if (currentCardEl) currentCardEl.dataset.hovered');

// Fix cardEl possibly undefined
content = content.replace(/const h = cardEl\.offsetHeight \|\| 120;/g, 'const h = (cardEl as HTMLElement).offsetHeight || 120;');
content = content.replace(/sidebar\.appendChild\(cardEl\);/g, 'sidebar.appendChild(cardEl as HTMLElement);');
content = content.replace(/keyToCard\.set\(key, cardEl\);/g, 'keyToCard.set(key, cardEl as HTMLElement);');
content = content.replace(/placedCards\.push\(\{ top: idealY, bottom: idealY \+ h, el: cardEl \}\);/g, 'placedCards.push({ top: idealY, bottom: idealY + h, el: cardEl as HTMLElement });');


fs.writeFileSync('src/layouts/BlogPostLayout.astro', content);

let smartLinkContent = fs.readFileSync('src/components/SmartLink.astro', 'utf8');
smartLinkContent = smartLinkContent.replace(/type = 'app-store';/, "type = 'app-store' as any;");
smartLinkContent = smartLinkContent.replace(/async function getEntryCaseInsensitive\(collection, idToFind\)/, 'async function getEntryCaseInsensitive(collection: any, idToFind: any)');
fs.writeFileSync('src/components/SmartLink.astro', smartLinkContent);
