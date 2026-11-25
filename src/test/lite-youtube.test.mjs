import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setImmediate } from 'node:timers';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const source = readFileSync(resolve('public/css/lite-yt-embed.js'), 'utf8');
const videoId = 'VpQigBObIlI';
let dom;
let window;
let unhandled;
let recordUnhandled;

beforeEach(() => {
  vi.useFakeTimers();
  dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://datadocks.com/', runScripts: 'outside-only',
  });
  window = dom.window;
  window.setTimeout = globalThis.setTimeout;
  window.clearTimeout = globalThis.clearTimeout;
  Object.defineProperty(window.navigator, 'vendor', { configurable: true, value: 'Google Inc.' });
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: 'Desktop test browser' });
  // Each test gets a new custom-element registry and loader state; no browser UI is used.
  window.eval(source);
  unhandled = [];
  recordUnhandled = reason => unhandled.push(reason);
  process.on('unhandledRejection', recordUnhandled);
});

afterEach(() => {
  process.off('unhandledRejection', recordUnhandled);
  dom.window.close();
  vi.useRealTimers();
});

async function flush() {
  await new Promise(resolve => setImmediate(resolve));
}

function createEmbed({ anchor = true, jsApi = true } = {}) {
  const embed = window.document.createElement('lite-youtube');
  embed.setAttribute('videoid', videoId);
  if (jsApi) embed.setAttribute('js-api', '');
  embed.style.backgroundImage = 'none';
  if (anchor) embed.innerHTML = `<a class="lty-playbtn" href="https://www.youtube.com/watch?v=${videoId}">Watch case study</a>`;
  window.document.body.append(embed);
  return embed;
}

function apiScript() {
  return window.document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
}

function click(embed) {
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  embed.querySelector('.lty-playbtn').dispatchEvent(event);
  return event;
}

function installPlayer() {
  const players = [];
  const Player = vi.fn(function (target, options) {
    const frame = window.document.createElement('iframe');
    frame.title = 'Customer story';
    target.replaceWith(frame);
    const player = {
      playVideo: vi.fn(),
      destroy: vi.fn(() => frame.remove()),
      options,
      frame,
    };
    players.push(player);
    return player;
  });
  window.YT = { Player, ready: callback => callback() };
  return { Player, players };
}

function expectFallback(embed) {
  const link = embed.querySelector('a.lty-playbtn');
  expect(link).not.toBeNull();
  expect(link.href).toBe(`https://www.youtube.com/watch?v=${videoId}`);
  expect(link.hasAttribute('role')).toBe(false);
  expect(link.textContent).toContain('Watch on YouTube');
  expect(embed.hasAttribute('data-yt-failed')).toBe(true);
  expect(embed.classList.contains('lyt-activated')).toBe(false);
  expect(embed.hasAttribute('aria-busy')).toBe(false);
  expect(embed.querySelector('iframe')).toBeNull();
  return link;
}

describe('lite YouTube recovery', () => {
  it.each([true, false])('restores a usable link after API failure (existing anchor: %s)', async anchor => {
    const embed = createEmbed({ anchor });
    embed.querySelector('.lty-playbtn').focus();
    expect(click(embed).defaultPrevented).toBe(true);
    apiScript().dispatchEvent(new window.Event('error'));
    await flush();
    const link = expectFallback(embed);
    expect(window.document.activeElement).toBe(link);
    // Observe the component's decision, then suppress JSDOM's unsupported navigation.
    let intercepted;
    embed.addEventListener('click', event => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    click(embed);
    expect(intercepted).toBe(false);
    expect(apiScript()).toBeNull();
    expect(unhandled).toEqual([]);
  });

  it('shares API loading and creates one player per embed across rapid hero and thumbnail actions', async () => {
    const first = createEmbed();
    const second = createEmbed();
    const hero = first.getYTPlayer();
    click(first);
    const repeated = first.getYTPlayer();
    const other = second.getYTPlayer();
    expect(window.document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1);
    const { Player, players } = installPlayer();
    apiScript().dispatchEvent(new window.Event('load'));
    await flush();
    expect(Player).toHaveBeenCalledTimes(2);
    players.forEach(player => player.options.events.onReady({ target: player }));
    expect(await hero).toBe(players[0]);
    expect(await repeated).toBe(players[0]);
    expect(await first.playerPromise).toBe(players[0]);
    expect(await other).toBe(players[1]);
    expect(players[0].playVideo).toHaveBeenCalledTimes(1);
    expect(first.querySelectorAll(':scope > iframe')).toHaveLength(1);
    expect(first.hasAttribute('aria-busy')).toBe(false);
    expect(unhandled).toEqual([]);
  });

  it('bounds secondary API readiness and ignores readiness after fallback', async () => {
    const embed = createEmbed();
    const pending = embed.getYTPlayer();
    const rejected = expect(pending).rejects.toThrow('YouTube API timed out');
    let ready;
    window.YT = { ready: callback => { ready = callback; } };
    apiScript().dispatchEvent(new window.Event('load'));
    await vi.advanceTimersByTimeAsync(10_001);
    await rejected;
    expectFallback(embed);
    const { Player } = installPlayer();
    ready();
    await flush();
    expect(Player).not.toHaveBeenCalled();
    expectFallback(embed);
    expect(unhandled).toEqual([]);
  });

  it.each(['timeout', 'error'])('ignores late player readiness after a player %s', async failure => {
    const { players } = installPlayer();
    const embed = createEmbed();
    const pending = embed.getYTPlayer();
    const rejected = expect(pending).rejects.toThrow(/YouTube (?:player timed out|playback unavailable)/);
    await flush();
    const player = players[0];
    if (failure === 'timeout') await vi.advanceTimersByTimeAsync(10_001);
    else player.options.events.onError({ data: 153 });
    await rejected;
    expectFallback(embed);
    expect(player.destroy).toHaveBeenCalledTimes(1);
    player.options.events.onReady({ target: player });
    await flush();
    expect(player.playVideo).not.toHaveBeenCalled();
    expectFallback(embed);
    expect(unhandled).toEqual([]);
  });

  it('restores the fallback when playback fails after the player became ready', async () => {
    const { players } = installPlayer();
    const embed = createEmbed();
    const pending = embed.getYTPlayer();
    await flush();
    const player = players[0];
    player.options.events.onReady({ target: player });
    expect(await pending).toBe(player);
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    player.options.events.onError({ data: 153 });
    await flush();
    expectFallback(embed);
    expect(player.destroy).toHaveBeenCalledTimes(1);
    expect(unhandled).toEqual([]);
  });

  it('uses the API on an Apple desktop without an explicit js-api attribute', async () => {
    Object.defineProperty(window.navigator, 'vendor', { configurable: true, value: 'Apple Computer, Inc.' });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
    });
    const embed = createEmbed({ jsApi: false });
    click(embed);
    expect(apiScript()).not.toBeNull();
    const { players } = installPlayer();
    apiScript().dispatchEvent(new window.Event('load'));
    await flush();
    players[0].options.events.onReady({ target: players[0] });
    await flush();
    expect(players[0].playVideo).toHaveBeenCalledTimes(1);
    expect(unhandled).toEqual([]);
  });
});
