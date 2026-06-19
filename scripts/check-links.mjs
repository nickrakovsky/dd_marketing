import { execSync } from 'child_process';

const previewUrl = process.argv[2];
if (!previewUrl) {
  console.error("Please provide a preview URL.");
  process.exit(1);
}

console.log(`Running Linkinator on ${previewUrl}...`);

let output;
try {
  // Run linkinator and format output as JSON
  output = execSync(`npx linkinator "${previewUrl}" --recurse --format json --retry --timeout 30000`, { 
    encoding: 'utf-8', 
    maxBuffer: 50 * 1024 * 1024 
  });
} catch (error) {
  // If linkinator finds failures, it exits with non-zero code. stdout contains the JSON report.
  output = error.stdout;
}

if (!output) {
  console.log("No output from linkinator.");
  process.exit(0);
}

try {
  const result = JSON.parse(output);
  const failures = result.links.filter(link => link.state === 'BROKEN');
  
  if (failures.length === 0) {
    console.log("✅ All links are valid!");
    process.exit(0);
  }

  const internalFailures = [];
  const externalFailures = [];

  for (const failure of failures) {
    // Determine if the link is internal
    // It's internal if it starts with the preview URL, starts with '/' (relative), 
    // or doesn't have a protocol (relative).
    const isInternal = failure.url.startsWith(previewUrl) || 
                       failure.url.startsWith('/') || 
                       (!failure.url.startsWith('http://') && !failure.url.startsWith('https://'));
                       
    if (isInternal) {
      internalFailures.push(failure);
    } else {
      externalFailures.push(failure);
    }
  }

  if (externalFailures.length > 0) {
    console.log("\n⚠️ Found broken external links (logged as warnings, will not fail build):");
    externalFailures.forEach(f => {
      console.log(`  - [Status ${f.status || '0'}] ${f.url} (found on ${f.parent})`);
    });
  }

  if (internalFailures.length > 0) {
    console.error("\n❌ Found broken internal links (failing build):");
    internalFailures.forEach(f => {
      console.error(`  - [Status ${f.status || '0'}] ${f.url} (found on ${f.parent})`);
    });
    process.exit(1);
  }

  console.log("\n✅ No broken internal links found.");
  process.exit(0);
} catch (e) {
  console.error("Failed to parse Linkinator output:", e);
  console.log("Raw output snippet:", output ? output.substring(0, 1000) : "empty");
  process.exit(1);
}
