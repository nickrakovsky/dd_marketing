// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

// Execute the exact inline production script; no extra client module/request.
const layout = readFileSync(new URL('../layouts/Layout.astro', import.meta.url), 'utf8');
const script = layout.match(/<script is:inline define:vars=\{\{ DEALFRONT_SITE_ID, DEALFRONT_ALLOWED_HOSTS \}\}>([\s\S]*?)<\/script>/)![1];

function setup({ readyState = 'loading', host = 'datadocks.com', idle = true } = {}) {
  const insertBefore = vi.fn();
  const firstScript = { parentNode: { insertBefore } };
  const listeners: Record<string, () => void> = {};
  const requestIdleCallback = vi.fn();
  const setTimeout = vi.fn();
  const window = {
    location: { hostname: host },
    addEventListener: vi.fn((event: string, callback: () => void) => { listeners[event] = callback; }),
    ...(idle ? { requestIdleCallback } : {}),
  };
  runInNewContext(script, {
    DEALFRONT_SITE_ID: 'test-site', DEALFRONT_ALLOWED_HOSTS: ['datadocks.com', 'www.datadocks.com'],
    window, requestIdleCallback, setTimeout,
    document: { readyState, createElement: () => ({}), getElementsByTagName: () => [firstScript] },
  });
  return { insertBefore, listeners, requestIdleCallback, setTimeout, window };
}

describe('Dealfront scheduling', () => {
  it('does not request or schedule the tracker before the window load event', () => {
    const env = setup();
    expect(env.requestIdleCallback).not.toHaveBeenCalled();
    expect(env.insertBefore).not.toHaveBeenCalled();
    expect(env.window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    env.listeners.load();
    expect(env.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 4000 });
    env.requestIdleCallback.mock.calls[0][0]();
    expect(env.insertBefore).toHaveBeenCalledWith(expect.objectContaining({
      src: 'https://sc.lfeeder.com/lftracker_v1_test-site.js', async: true,
    }), expect.anything());
  });

  it('handles scripts executed after load without waiting for a missed event', () => {
    const env = setup({ readyState: 'complete' });
    expect(env.requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(env.window.addEventListener).not.toHaveBeenCalled();
  });

  it('keeps the existing timer fallback, but starts it only after load', () => {
    const env = setup({ idle: false });
    expect(env.setTimeout).not.toHaveBeenCalled();
    env.listeners.load();
    expect(env.setTimeout).toHaveBeenCalledWith(expect.any(Function), 2500);
    env.setTimeout.mock.calls[0][0]();
    expect(env.insertBefore).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate scheduling or insertion', () => {
    const env = setup();
    env.listeners.load();
    env.listeners.load();
    expect(env.requestIdleCallback).toHaveBeenCalledTimes(1);
    const load = env.requestIdleCallback.mock.calls[0][0];
    load(); load();
    expect(env.insertBefore).toHaveBeenCalledTimes(1);
  });

  it.each(['preview.dd-marketing.pages.dev', 'localhost', 'datadocks.com.example.org'])(
    'does not track visitors on %s', host => {
      const env = setup({ host, readyState: 'complete' });
      expect(env.requestIdleCallback).not.toHaveBeenCalled();
      expect(env.setTimeout).not.toHaveBeenCalled();
      expect(env.insertBefore).not.toHaveBeenCalled();
    },
  );
});
