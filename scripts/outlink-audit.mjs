import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { githubClient } from './outlink-audit/github.mjs';
import { checkGate } from './outlink-audit/gate.mjs';

// Local report-only crawl: npm run audit:outlinks (never changes GitHub issues).
// Offline regression tests: npm run test:outlinks.
// Tune seeds/first-party aliases or add {url, reason} exceptions in config.json.
// In Actions, manual runs honor the cooldown unless force is explicitly selected;
// report_only still performs a real crawl and therefore records an audit attempt.
const directory = process.env.OUTLINK_OUTPUT_DIR || (process.env.RUNNER_TEMP
  ? `${process.env.RUNNER_TEMP}/outlink-audit` : 'internal/outlink-audit');
const config = JSON.parse(await readFile(new URL('./outlink-audit/config.json', import.meta.url), 'utf8'));
const writeJson = async (name, data) => {
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/${name}`, `${JSON.stringify(data, null, 2)}\n`);
};
const summary = async text => {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
};

try {
  switch (process.argv[2]) {
    case 'gate': {
      const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
      const decision = await checkGate({ client: githubClient(), repository: process.env.GITHUB_REPOSITORY,
        eventName: process.env.GITHUB_EVENT_NAME, event, config });
      await writeJson('gate.json', decision);
      await summary(decision.reason);
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `due=${decision.due}\n`);
      break;
    }
    case 'mark-start':
      await writeJson('start.json', { startedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID });
      break;
    case 'scan': {
      const { runAudit } = await import('./outlink-audit/core.mjs');
      const { summarize } = await import('./outlink-audit/report.mjs');
      const report = await runAudit({ siteUrl: config.siteUrl, config });
      await writeJson('report.json', report);
      await summary(summarize(report));
      if (!report.complete) process.exitCode = 1;
      break;
    }
    case 'report': {
      const { syncIssue } = await import('./outlink-audit/report.mjs');
      const report = JSON.parse(await readFile(`${directory}/report.json`, 'utf8'));
      const result = await syncIssue({ report, client: githubClient(), repository: process.env.GITHUB_REPOSITORY,
        runUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        dryRun: process.env.OUTLINK_REPORT_ONLY === 'true' });
      await summary(`Issue reporting: ${result.dryRun ? 'report-only; proposed ' : ''}${result.action}${result.issueNumber ? ` (#${result.issueNumber})` : ''}.`);
      break;
    }
    default:
      throw new Error('Usage: node scripts/outlink-audit.mjs gate|mark-start|scan|report');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
