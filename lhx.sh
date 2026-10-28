#!/bin/bash
export PATH=/opt/homebrew/bin:$PATH
U="$1"; N="$2"; CPU="${3:-4}"
./node_modules/.bin/lighthouse "$U" --only-categories=performance --form-factor=mobile \
  --screenEmulation.mobile --throttling.cpuSlowdownMultiplier=$CPU \
  --output=json --output-path="/tmp/lh-$N.json" --quiet \
  --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
python3 -c "
import json
d=json.load(open('/tmp/lh-$N.json')); a=d['audits']
mt=sum(i['duration'] for i in a['mainthread-work-breakdown']['details']['items'])
print(f\"  cpu={$CPU}x  score={round(d['categories']['performance']['score']*100):3}  FCP={a['first-contentful-paint']['displayValue']:>7}  LCP={a['largest-contentful-paint']['displayValue']:>7}  mainthread={mt:.0f}ms\")
"
