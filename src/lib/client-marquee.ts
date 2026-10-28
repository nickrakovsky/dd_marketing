import { wrapClientOffset } from './client-marquee-offset';

// Animation and drag behavior shared by the original homepage and the prototype.
export function initClientMarquee(marquee: HTMLElement, track: HTMLElement) {
    const speed = 30; // pixels per second, independent of display refresh rate
    let position = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragStartPos = 0;
    const threshold = 7;
    let rafId: number | undefined;
    let visible = false;
    let disposed = false;
    let initialized = false;
    let lastFrame = 0;
    let pointerId: number | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Use ResizeObserver to read the track width passively.
    // entry.contentRect.width is provided by the browser after layout completes
    // and does NOT trigger a forced reflow — unlike track.scrollWidth which
    // forces synchronous layout when read outside a layout boundary.
    let setW = 0;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newSetW = entry.contentRect.width / 5;
        if (newSetW === setW) return;
        setW = newSetW;
        if (!initialized && setW > 0) {
          // First measurement: position two sets to the left so there's content
          // in both directions before the user interacts.
          position = -(setW * 2);
          track.style.transform = `translateX(${position}px)`;
          initialized = true;
        }
      }
      syncAnimation();
    });
    ro.observe(track);

    const animate = (time: number) => {
      const elapsed = lastFrame ? Math.min(time - lastFrame, 64) / 1000 : 0;
      lastFrame = time;
      rafId = undefined;
      if (disposed || !visible || isDragging || setW <= 0 || document.hidden || reduced.matches) return;
      {
        position = wrapClientOffset(position - speed * elapsed, setW);
        track.style.transform = `translateX(${position}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      rafId = undefined;
      lastFrame = 0;
      if (!disposed && visible && !isDragging && setW > 0 && !document.hidden && !reduced.matches) {
        rafId = requestAnimationFrame(animate);
      }
    };
    const visibility = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncAnimation();
    });
    visibility.observe(marquee);
    document.addEventListener('visibilitychange', syncAnimation);
    reduced.addEventListener('change', syncAnimation);
    const listeners = new AbortController();

    marquee.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragStartPos = position;
      marquee.setPointerCapture(e.pointerId);

      // Desktop: immediate drag and prevent text selection
      if (e.pointerType === 'mouse') {
        isDragging = true;
        e.preventDefault();
        syncAnimation();
      }
    }, { signal: listeners.signal });

    marquee.addEventListener('pointermove', (e) => {
      if (pointerId !== e.pointerId) return;
      if (isDragging) {
        const dx = e.clientX - startX;
        position = wrapClientOffset(dragStartPos + dx, setW);
        track.style.transform = `translateX(${position}px)`;
      } else if (e.pointerType !== 'mouse') {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx > threshold && dx > dy) {
          isDragging = true;
          // IMPORTANT: re-sync start points to avoid jump from animation progress
          dragStartPos = position;
          startX = e.clientX;
          syncAnimation();
        }
      }
    }, { signal: listeners.signal });

    const endDrag = () => {
      pointerId = null;
      isDragging = false;
      syncAnimation();
    };
    marquee.addEventListener('pointerup', endDrag, { signal: listeners.signal });
    marquee.addEventListener('pointercancel', endDrag, { signal: listeners.signal });
    marquee.addEventListener('lostpointercapture', endDrag, { signal: listeners.signal });

    marquee.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      position = wrapClientOffset(position + (event.key === 'ArrowLeft' ? 180 : -180), setW);
      track.style.transform = `translateX(${position}px)`;
    }, { signal: listeners.signal });
    return () => {
      disposed = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      ro.disconnect();
      visibility.disconnect();
      listeners.abort();
      document.removeEventListener('visibilitychange', syncAnimation);
      reduced.removeEventListener('change', syncAnimation);
    };
}
