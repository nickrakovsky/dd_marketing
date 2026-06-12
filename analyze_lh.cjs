const fs = require('fs');
const html = fs.readFileSync('report.html', 'utf8');
const match = html.match(/window\.__LIGHTHOUSE_JSON__ = (\{.*?\});<\/script>/s);
if (match) {
  const data = JSON.parse(match[1]);
  console.log('Score:', data.categories.performance.score);
  console.log('LCP:', data.audits['largest-contentful-paint'].displayValue);
  console.log('TBT:', data.audits['total-blocking-time'].displayValue);
  console.log('CLS:', data.audits['cumulative-layout-shift'].displayValue);
  
  const opps = Object.values(data.audits).filter(a => a.details && a.details.type === 'opportunity' && a.score < 1);
  console.log('\nOpportunities:');
  opps.forEach(a => console.log(a.title, ':', a.displayValue));

  const diagnostics = Object.values(data.audits).filter(a => a.score !== null && a.score < 1 && a.details && !['opportunity'].includes(a.details.type));
  console.log('\nDiagnostics:');
  diagnostics.forEach(a => console.log(a.title, ':', a.displayValue || a.score));

} else {
  console.log('Not found');
}
