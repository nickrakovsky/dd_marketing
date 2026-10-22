import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyRedirect } from './legacy-domain-redirect.mjs';

for (const hostname of ['getdatadocks.com', 'www.getdatadocks.com']) {
  test(`${hostname} secures the same host before changing domains`, () => {
    const http = legacyRedirect(new Request(`http://${hostname}/posts/example?utm_source=test&x=%2F&x=2`));
    assert.equal(http.status, 301);
    assert.equal(http.headers.get('Location'), `https://${hostname}/posts/example?utm_source=test&x=%2F&x=2`);
    assert.equal(http.headers.get('Strict-Transport-Security'), null);
    const https = legacyRedirect(new Request(http.headers.get('Location')));
    assert.equal(https.headers.get('Location'), 'https://datadocks.com/posts/example?utm_source=test&x=%2F&x=2');
    assert.equal(https.headers.get('Strict-Transport-Security'), 'max-age=31536000; includeSubDomains');
  });
}

test('root and legacy alternate port use the canonical HTTPS destination', () => {
  const root = legacyRedirect(new Request('https://getdatadocks.com:8443/'));
  assert.equal(root.status, 301);
  assert.equal(root.headers.get('Location'), 'https://datadocks.com/');
});

test('query strings and path segments cannot redirect to an arbitrary host', () => {
  const response = legacyRedirect(new Request('https://getdatadocks.com//attacker.example/?next=https://attacker.example'));
  assert.equal(new URL(response.headers.get('Location')).hostname, 'datadocks.com');
});

test('unrelated application hostnames are not redirected', () => {
  const response = legacyRedirect(new Request('https://app.datadocks.com/'));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Location'), null);
});

test('the HTTPS redirect carries protections without serving an HTML page', async () => {
  const response = legacyRedirect(new Request('https://getdatadocks.com/'));
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.match(response.headers.get('Content-Security-Policy'), /default-src 'none'/);
});
