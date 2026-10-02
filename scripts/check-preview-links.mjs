import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LinkChecker } from 'linkinator';

export function previewOptions(previewUrl) {
  const url = new URL(previewUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Preview URL must use HTTP or HTTPS');
  }
  return {
    path: url.href,
    recurse: true,
    retry: true,
    retryErrors: true,
    retryErrorsCount: 2,
    concurrency: 25,
    timeout: 30_000,
    urlRewriteExpressions: [{
      pattern: /^https?:\/\/(www\.)?datadocks\.com(?=[/?#]|$)/,
      replacement: url.origin,
    }],
    // Linkinator applies rewrites before this filter. Check production marketing
    // links on the preview, but skip apps and other third-party origins.
    linksToSkip: link => new URL(link).origin !== url.origin,
  };
}

export async function crawlPreview(previewUrl, {
  checker = new LinkChecker(),
  deadlineMs = 10 * 60_000,
} = {}) {
  const observed = [];
  const onLink = link => observed.push(link);
  checker.on('link', onLink);
  let timer;
  try {
    const options = previewOptions(previewUrl);
    // Linkinator's retry queue uses an unref'ed maintenance interval. Keep the
    // event loop alive until it drains, with a deadline for a genuinely stuck
    // crawl. Without this, Node can exit 13 before Linkinator returns any JSON.
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Link crawl timed out after ${deadlineMs}ms`)), deadlineMs);
    });
    const result = await Promise.race([checker.check(options), deadline]);
    if (!Array.isArray(result?.links) || result.links.length === 0 || typeof result.passed !== 'boolean') {
      throw new Error('Linkinator returned an empty or invalid report');
    }
    const broken = result.links.filter(link => link.state === 'BROKEN');
    if (!result.passed && broken.length === 0) {
      throw new Error('Linkinator failed without reporting the cause');
    }
    return { ...result, passed: result.passed && broken.length === 0, complete: true };
  } catch (error) {
    return { passed: false, complete: false, links: observed, error: error.message };
  } finally {
    clearTimeout(timer);
    checker.off('link', onLink);
  }
}

function escapeAnnotation(value) {
  return String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

async function main() {
  const report = await crawlPreview(process.argv[2]);
  writeFileSync(process.argv[3] || 'linkinator-results.json', JSON.stringify(report, null, 2) + '\n');
  if (!report.complete) {
    console.error(`::error title=Link crawl failed::${escapeAnnotation(report.error)}`);
    // Stop any remaining requests after the deadline; an incomplete crawl can
    // never pass the check. The partial report is already safely written.
    process.exit(1);
  }
  const broken = report.links.filter(link => link.state === 'BROKEN');
  if (broken.length) {
    console.error(`::error title=Broken preview links::Found ${broken.length} broken links`);
    for (const link of broken) {
      console.error(`::error::${escapeAnnotation(`${link.status} ${link.url} (from ${link.parent || 'root'})`)}`);
    }
    process.exitCode = 1;
  } else {
    const checked = report.links.filter(link => link.state !== 'SKIPPED').length;
    console.log(`Linkinator passed: ${checked} links checked with 0 broken links.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
