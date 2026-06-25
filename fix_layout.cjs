const fs = require('fs');

let content = fs.readFileSync('src/layouts/BlogPostLayout.astro', 'utf8');

// 1. App Store UI Insertion
const appStoreUI = `    }

    if (type === 'app-store') {
      const isApple = (dataset.smartlinkHref || '').includes('apple');
      const storeName = isApple ? 'App Store' : 'Google Play';
      const iconSvg = isApple 
        ? \`<svg class="w-8 h-8 text-black dark:text-white" fill="currentColor" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>\`
        : \`<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><path d="M3.715 2.124A1.85 1.85 0 003 3.65v16.7c0 .548.243 1.05.658 1.39l.067.054 9.516-9.513v-.37l-9.46-9.46-.066.073z" fill="#00e5ff"/><path d="M17.472 15.932l-4.23-4.23v-.37l4.233-4.233.1.56 5.013 2.844c1.433.81 1.433 2.133 0 2.946l-5.116 2.483z" fill="#ffeb3b"/><path d="M17.575 16.03l-4.333-4.33-10-10C3.784 1.258 4.606 1.11 5.485 1.6l12.09 6.85-4.333 4.33" fill="#00e676"/><path d="M17.575 8.16l-4.333 4.33-10 10c.542.44 1.36.494 2.243 0l12.09-6.85-4.333-4.33z" fill="#f44336"/></svg>\`;

      return \`
        <div class="relative w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-[#fd4f00] dark:hover:border-[#ff7635] transition-all duration-300 not-prose mt-2 mb-2 group/appstore cursor-pointer flex items-center justify-between">
          <a href="\${href}" class="absolute inset-0 z-10"><span class="sr-only">Download on the \${storeName}</span></a>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 group-hover/appstore:scale-105 transition-transform duration-300">
              \${iconSvg}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 leading-tight">Available on the</span>
              <span class="text-base font-bruta font-bold text-gray-900 dark:text-white leading-tight">\${storeName}</span>
            </div>
          </div>
          <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover/appstore:bg-[#fd4f00] group-hover/appstore:text-white transition-colors duration-300">
            <svg class="w-4 h-4 translate-x-0 group-hover/appstore:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      \`;
    }`;
content = content.replace(/    \}\n\n    let iconHtml = '';/m, appStoreUI + "\n\n    let iconHtml = '';");

// 2. Table Blockers Fix
content = content.replace(/document\.querySelectorAll\('\.prose \.table-wrapper'\)/, "document.querySelectorAll('.prose .table-wrapper, .prose > table')");

// 3. getPremiumCardHTML return type
content = content.replace(/function getPremiumCardHTML\(dataset: any, isInline: boolean = false\)/, "function getPremiumCardHTML(dataset: any, isInline: boolean = false): string");

fs.writeFileSync('src/layouts/BlogPostLayout.astro', content);
