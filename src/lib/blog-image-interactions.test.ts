import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

beforeAll(async () => {
  await import('./dynamic-slotting-refill.mjs');
  await import('./dwell-time-journey.mjs');
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('external blog interaction modules', () => {
  it.each([
    ['DwellTimeJourney', 'dwell-time-journey'],
    ['DynamicSlottingRefill', 'dynamic-slotting-refill'],
  ])('%s always references an external module', (component, module) => {
    const source = readFileSync(`src/components/blog/${component}.astro`, 'utf8');
    expect(source).toContain(`${module}.mjs?url&no-inline`);
    expect(source).toMatch(/<script type="module" src=\{\w+\}><\/script>/);
    expect(source).not.toMatch(/<script(?:\s+is:inline)?>/);
  });

  it('updates the suggested refill after changing picks and occupied slots, including reconnects', () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
    document.body.innerHTML = `<dynamic-slotting-refill>
      ${['B', 'B', 'C', 'B'].map((sku, index) => `<button data-pick="${index}" disabled>${sku}</button>`).join('')}
      <button data-slot="0" disabled>A</button><button data-slot="1" disabled>C</button>
      <span data-mirror="0"></span><span data-mirror="1"></span>
      <span data-result></span><p class="refill-detail"></p>
    </dynamic-slotting-refill>`;
    const app = document.querySelector('dynamic-slotting-refill')!;
    const firstPick = app.querySelector<HTMLButtonElement>('[data-pick="0"]')!;
    expect(firstPick.disabled).toBe(false);
    expect(app.querySelector('[data-result]')).toHaveTextContent('B');
    expect(app.querySelector('.refill-detail')).toHaveTextContent('B has 3 upcoming picks and no slot.');

    firstPick.click();
    expect(firstPick).toHaveTextContent('C');
    expect(app.querySelector('.refill-detail')).toHaveTextContent('B has 2 upcoming picks and no slot.');
    app.querySelector<HTMLButtonElement>('[data-slot="0"]')!.click();
    expect(app.querySelector('[data-mirror="0"]')).toHaveTextContent('B');
    expect(app.querySelector('[data-result]')).toHaveTextContent('C');
    expect(app.querySelector('.refill-detail')).toHaveTextContent('Consider an extra C slot.');

    app.remove();
    document.body.append(app);
    firstPick.click();
    expect(firstPick).toHaveTextContent('D');
  });

  it('enables journey controls and changes the photograph only after decoding it', async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const previousDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
    Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: decode });
    try {
      document.body.innerHTML = `<dwell-time-journey>
        <div class="journey-scene"></div><p data-load-status></p>
        <button data-stage="0" data-title="Arrival" data-insight="Arrival copy" aria-pressed="true" disabled>Arrival</button>
        <button data-stage="1" data-position="36.111%" data-title="Waiting" data-insight="Waiting copy" aria-pressed="false" disabled>Waiting</button>
        <div data-stage-photo="0"><img alt="Arrival" /></div>
        <div data-stage-photo="1" hidden><template data-photo-template><img alt="Waiting" /></template></div>
        <span data-route-stop="0" data-current="true"></span><span data-route-stop="1" data-current="false"></span>
        <h3 data-insight-title>Arrival</h3><p data-insight-copy>Arrival copy</p>
      </dwell-time-journey>`;
      const app = document.querySelector('dwell-time-journey')!;
      const waiting = app.querySelector<HTMLButtonElement>('[data-stage="1"]')!;
      expect(waiting.disabled).toBe(false);
      expect(app.querySelector('[data-stage-photo="1"] img')).toBeNull();
      waiting.click();
      expect(app.querySelector('[data-stage-photo="0"]')).not.toHaveAttribute('hidden');
      await vi.waitFor(() => expect(waiting).toHaveAttribute('aria-pressed', 'true'));
      expect(decode).toHaveBeenCalledOnce();
      expect(app.querySelector('[data-stage-photo="0"]')).toHaveAttribute('hidden');
      expect(app.querySelector('[data-stage-photo="1"]')).not.toHaveAttribute('hidden');
      expect(app.querySelector('[data-route-stop="1"]')).toHaveAttribute('data-current', 'true');
      expect(app.querySelector('[data-insight-title]')).toHaveTextContent('Waiting');
      expect(app.querySelector('[data-insight-copy]')).toHaveTextContent('Waiting copy');
    } finally {
      if (previousDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', previousDecode);
      else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    }
  });
});
