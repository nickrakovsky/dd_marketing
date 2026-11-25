/* Adapted from Paul Irish's lite-youtube-embed: https://github.com/paulirish/lite-youtube-embed */
"use strict";
const YT_LOAD_TIMEOUT = 10000;

class LiteYTEmbed extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.videoId = this.getAttribute('videoid');
    let button = this.querySelector('.lty-playbtn');
    this.playLabel = button?.textContent.trim() || this.getAttribute('playlabel') || 'Play';
    this.dataset.title = this.getAttribute('title') || '';
    if (!this.style.backgroundImage) {
      this.style.backgroundImage = `url("/yt-thumb/${this.videoId}")`;
      this.upgradePosterImage();
    }
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'lty-playbtn';
      this.append(button);
    }
    if (!button.textContent) {
      const label = document.createElement('span');
      label.className = 'lyt-visually-hidden';
      label.textContent = this.playLabel;
      button.append(label);
    }
    this.addNoscriptIframe();
    if (button.nodeName === 'A') {
      // Preserve the real destination for modified clicks and loading failures.
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      button.addEventListener('keydown', event => {
        if (event.key === ' ' && !this.hasAttribute('data-yt-failed')) {
          event.preventDefault();
          void this.activate().catch(() => {});
        }
      });
    }
    this.addEventListener('pointerover', LiteYTEmbed.warmConnections, { once: true });
    this.addEventListener('focusin', LiteYTEmbed.warmConnections, { once: true });
    this.addEventListener('click', event => {
      if (this.hasAttribute('data-yt-failed') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      // activate restores the fallback; clicks must not leave unhandled rejections.
      void this.activate().catch(() => {});
    });
    this.needsYTApi = this.hasAttribute('js-api') || navigator.vendor.includes('Apple') || navigator.userAgent.includes('Mobi');
  }

  static addPrefetch(rel, href, as) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    document.head.append(link);
  }

  static warmConnections() {
    if (LiteYTEmbed.preconnected) return;
    for (const origin of ['https://www.youtube-nocookie.com', 'https://www.google.com', 'https://googleads.g.doubleclick.net', 'https://static.doubleclick.net']) {
      LiteYTEmbed.addPrefetch('preconnect', origin);
    }
    LiteYTEmbed.preconnected = true;
  }

  fetchYTPlayerApi() {
    if (window.YT?.Player) return Promise.resolve();
    if (!LiteYTEmbed.apiPromise) {
      // Share loading between embeds; bound failures in the secondary widget script too.
      LiteYTEmbed.apiPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        let settled = false;
        const finish = error => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          script.onload = script.onerror = null;
          if (error) { script.remove(); reject(error); }
          else resolve();
        };
        const timer = setTimeout(() => finish(new Error('YouTube API timed out')), YT_LOAD_TIMEOUT);
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onload = () => {
          if (!window.YT?.ready) return finish(new Error('YouTube API unavailable'));
          try {
            window.YT.ready(() => finish(window.YT.Player ? null : new Error('YouTube player unavailable')));
          } catch (error) { finish(error); }
        };
        script.onerror = () => finish(new Error('YouTube API failed to load'));
        document.head.append(script);
      }).catch(error => { LiteYTEmbed.apiPromise = null; throw error; });
    }
    return LiteYTEmbed.apiPromise;
  }

  async getYTPlayer() {
    this.needsYTApi = true;
    return this.activate();
  }

  async addYTPlayerIframe() {
    await this.fetchYTPlayerApi();
    const host = document.createElement('div');
    this.playerHost = host;
    this.append(host);
    // Resource-hub controls observe this promise to pause off-screen videos.
    this.playerPromise = new Promise((resolve, reject) => {
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      };
      const timer = setTimeout(() => fail(new Error('YouTube player timed out')), YT_LOAD_TIMEOUT);
      try {
        this.player = new window.YT.Player(host, {
          width: '100%', videoId: this.videoId,
          playerVars: Object.fromEntries(this.getParams().entries()),
          events: {
            onReady: event => {
              if (settled) return;
              try {
                event.target.playVideo();
                settled = true;
                clearTimeout(timer);
                resolve(event.target);
              } catch (error) { fail(error); }
            },
            onError: () => {
              if (settled) this.showFallback();
              else fail(new Error('YouTube playback unavailable'));
            },
          },
        });
      } catch (error) { fail(error); }
    });
    return this.playerPromise;
  }

  addNoscriptIframe() {
    const noscript = document.createElement('noscript');
    noscript.innerHTML = this.createBasicIframe().outerHTML;
    this.append(noscript);
  }

  getParams() {
    const params = new URLSearchParams(this.getAttribute('params') || []);
    params.set('autoplay', '1');
    params.set('playsinline', '1');
    return params;
  }

  activate() {
    if (this.hasAttribute('data-yt-failed')) return Promise.reject(new Error('Use the YouTube fallback link'));
    if (this.activationPromise) return this.activationPromise;
    this.classList.add('lyt-activated');
    this.setAttribute('aria-busy', 'true');
    this.activationPromise = (async () => {
      try {
        if (this.needsYTApi) return await this.addYTPlayerIframe();
        const iframe = this.createBasicIframe();
        this.append(iframe);
        iframe.focus();
      } catch (error) {
        this.showFallback();
        throw error;
      } finally { this.removeAttribute('aria-busy'); }
    })();
    return this.activationPromise;
  }

  showFallback() {
    const button = this.querySelector('.lty-playbtn');
    const restoreFocus = button === document.activeElement || this.contains(document.activeElement);
    try { this.player?.destroy(); } catch { /* Remove the failed iframe even if the API cannot clean up. */ }
    this.playerHost?.remove();
    this.querySelectorAll('iframe').forEach(iframe => iframe.remove());
    const link = button?.nodeName === 'A' ? button : document.createElement('a');
    link.className = 'lty-playbtn';
    link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(this.videoId)}`;
    link.removeAttribute('role');
    link.setAttribute('aria-label', 'Video unavailable here. Watch on YouTube');
    link.textContent = 'Watch on YouTube';
    if (link !== button) button ? button.replaceWith(link) : this.append(link);
    this.setAttribute('data-yt-failed', '');
    this.classList.remove('lyt-activated');
    if (restoreFocus) link.focus({ preventScroll: true });
  }

  createBasicIframe() {
    const iframe = document.createElement('iframe');
    iframe.width = 560;
    iframe.height = 315;
    iframe.title = this.playLabel;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${this.getParams()}`;
    return iframe;
  }

  upgradePosterImage() {
    setTimeout(() => {
      const source = `/yt-thumb/${this.videoId}?q=sdwebp`;
      const image = new Image();
      image.fetchPriority = 'low';
      image.referrerPolicy = 'origin';
      image.src = source;
      image.onload = () => {
        if (image.naturalHeight !== 90 || image.naturalWidth !== 120) this.style.backgroundImage = `url("${source}")`;
      };
    }, 100);
  }
}

customElements.define('lite-youtube', LiteYTEmbed);
