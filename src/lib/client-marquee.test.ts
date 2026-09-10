import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initClientMarquee } from './client-marquee';

let visible: (value: boolean) => void;
let measure: () => void;
let cleanup: () => void;
let frames: Map<number, FrameRequestCallback>;
let marquee: HTMLElement;
let track: HTMLElement;
let hidden = false;
let reduced = false;

beforeEach(() => {
  frames = new Map();
  let nextFrame = 0;
  hidden = false;
  reduced = false;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      visible = value => callback([{ isIntersecting: value } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {} disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) {
      measure = () => callback([{ contentRect: { width: 9000 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    observe() {} disconnect() {}
  });
  marquee = document.createElement('div');
  track = document.createElement('div');
  marquee.append(track);
  marquee.setPointerCapture = vi.fn();
  cleanup = initClientMarquee(marquee, track);
  measure();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function tick(time: number) {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach(callback => callback(time));
}
function pointer(type: string, x: number) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: 0 });
  marquee.dispatchEvent(event);
}

describe('customer carousel activity', () => {
  it('does no frame work offscreen, stops when leaving view, and resumes in view', () => {
    expect(frames.size).toBe(0);
    visible(true);
    tick(1000); tick(1016);
    expect(frames.size).toBe(1);
    const moved = track.style.transform;
    visible(false);
    expect(frames.size).toBe(0);
    tick(9000);
    expect(track.style.transform).toBe(moved);
    visible(true);
    tick(9016); tick(9032);
    expect(track.style.transform).not.toBe(moved);
  });
  it('keeps drag usable and resumes from the dragged position', () => {
    visible(true);
    pointer('pointerdown', 100);
    expect(frames.size).toBe(0);
    pointer('pointermove', 200);
    const dragged = track.style.transform;
    expect(dragged).not.toBe('translateX(-3600px)');
    pointer('pointerup', 200);
    expect(frames.size).toBe(1);
    tick(1000);
    expect(track.style.transform).toBe(dragged);
    tick(1016);
    expect(track.style.transform).not.toBe(dragged);
  });
  it('does no frame work in a hidden tab or with reduced motion', () => {
    visible(true);
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    hidden = false;
    reduced = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    marquee.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(track.style.transform).not.toBe('translateX(-3600px)');
  });
  it('cancels work and releases interaction handlers when disposed', () => {
    visible(true);
    cleanup();
    expect(frames.size).toBe(0);
    const original = track.style.transform;
    marquee.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(track.style.transform).toBe(original);
  });
});
