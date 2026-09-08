#!/bin/bash
export PATH=/opt/homebrew/bin:$PATH
U="$1"; N="${2:-run}"
./node_modules/.bin/lighthouse "$U" --only-categories=performance --form-factor=mobile \
  --screenEmulation.mobile --output=json --output-path="/tmp/lh-$N.json" --quiet \
  --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
python3 -c "
import json,sys
d=json.load(open('/tmp/lh-$N.json')); a=d['audits']
print(f\"  $N: score={round(d['categories']['performance']['score']*100)}  FCP={a['first-contentful-paint']['displayValue']}  LCP={a['largest-contentful-paint']['displayValue']}  TBT={a['total-blocking-time']['displayValue']}  CLS={a['cumulative-layout-shift']['displayValue']}  SI={a['speed-index']['displayValue']}\")
"
