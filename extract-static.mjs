import fs from 'fs';
import path from 'path';

function extractAndWrap(filename, outPath, title, description) {
    const inputPath = path.join(process.cwd(), 'webflow-migration/webflow-export', filename);
    const htmlObj = fs.readFileSync(inputPath, 'utf8');

    // VERY hacky but quick way to extract just the main content, assuming it's inside <div class="main-wrapper"> or a known section
    // Let's grab everything between '<div class="main-wrapper">' and '<div class="footer-section">'
    const match = htmlObj.match(/<div class="main-wrapper">(.*?)<div class="footer-section">/s);
    let content = match ? match[1] : '';

    if (!content && htmlObj.includes('<main')) {
       const mainMatch = htmlObj.match(/<main[^>]*>(.*?)<\/main>/s);
       content = mainMatch ? mainMatch[1] : '';
    }

    if (!content) {
        // Fallback: extract body inner
        const bodyMatch = htmlObj.match(/<body[^>]*>(.*?)<\/body>/s);
        content = bodyMatch ? bodyMatch[1] : '';
    }

    // Wrap in Astro Layout
    const astroContent = `---
import Layout from '../layouts/Layout.astro';
import Navigation from '../components/Navigation.jsx';
import Footer from '../components/Footer.astro';
---

<Layout title="${title}" description="${description}">
  <Navigation client:idle />
  
  <main class="bg-[#FFF8E9] min-h-screen pt-32 pb-24 prose prose-lg prose-orange max-w-7xl mx-auto px-6 lg:px-8">
    ${content}
  </main>

  <Footer />
</Layout>
`;

    fs.writeFileSync(path.join(process.cwd(), 'src/pages', outPath), astroContent);
    console.log('Migrated', filename);
}

extractAndWrap('privacy-policy-datadocks.html', 'privacy-policy.astro', 'Privacy Policy | DataDocks', 'DataDocks Privacy Policy');
extractAndWrap('datadocks-vs-opendock.html', 'datadocks-vs-opendock.astro', 'DataDocks vs OpenDock', 'A comprehensive comparison between DataDocks and OpenDock');
