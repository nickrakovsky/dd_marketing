import { execFileSync } from 'node:child_process';

// .gitignore does not untrack existing files or stop `git add --force`.
// Reject both cases in CI, using the same policy as normal Git staging.
const ignored = execFileSync('git', ['ls-files', '-ci', '--exclude-standard', '-z'], {
  encoding: 'utf8',
}).split('\0').filter(Boolean);

if (ignored.length) {
  console.error('Ignored/local-only files are tracked in Git. Remove them from the index with git rm --cached (keep local copies):');
  for (const path of ignored) console.error(`  ${path}`);
  process.exitCode = 1;
} else {
  console.log('Repository hygiene passed: no ignored/local-only files are tracked.');
}
