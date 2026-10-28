class DwellTimeJourney extends HTMLElement {
    events;
    selection = 0;
    connectedCallback() {
        if (this.events)
            return;
        this.events = new AbortController();
        this.addEventListener('click', this.selectStage, { signal: this.events.signal });
        const buttons = this.querySelectorAll('[data-stage]');
        buttons.forEach(button => {
            button.disabled = false;
        });
    }
    disconnectedCallback() {
        this.selection += 1;
        this.events?.abort();
        this.events = undefined;
    }
    selectStage = async (event) => {
        if (!(event.target instanceof Element))
            return;
        const button = event.target.closest('button[data-stage]');
        if (!button || !this.contains(button) || button.disabled)
            return;
        const selection = ++this.selection;
        const loadStatus = this.querySelector('[data-load-status]');
        if (loadStatus)
            delete loadStatus.dataset.error;
        const scene = this.querySelector('.journey-scene');
        const controls = this.querySelectorAll('[data-stage]');
        controls.forEach(control => { delete control.dataset.loading; });
        if (button.getAttribute('aria-pressed') === 'true') {
            scene?.removeAttribute('aria-busy');
            if (loadStatus)
                loadStatus.textContent = '';
            return;
        }
        const stage = button.dataset.stage;
        const photograph = this.querySelector(`[data-stage-photo="${stage}"]`);
        if (!photograph)
            return;
        // Inert templates keep unvisited photographs out of the browser's fetch queue.
        const template = photograph.querySelector('template[data-photo-template]');
        if (template) {
            photograph.append(template.content.cloneNode(true));
            template.remove();
        }
        // Keep the current photograph visible until its replacement is ready.
        const photoImage = photograph.querySelector('img');
        button.dataset.loading = 'true';
        scene?.setAttribute('aria-busy', 'true');
        if (loadStatus)
            loadStatus.textContent = 'Loading photograph…';
        try {
            if (!photoImage)
                throw new Error('Missing journey photograph');
            await photoImage.decode();
        }
        catch {
            if (selection !== this.selection || !this.isConnected)
                return;
            delete button.dataset.loading;
            scene?.removeAttribute('aria-busy');
            if (loadStatus) {
                loadStatus.textContent = 'Photo unavailable. Try another stage.';
                loadStatus.dataset.error = 'true';
            }
            return;
        }
        if (selection !== this.selection || !this.isConnected)
            return;
        delete button.dataset.loading;
        scene?.removeAttribute('aria-busy');
        if (loadStatus)
            loadStatus.textContent = '';
        const photographs = this.querySelectorAll('[data-stage-photo]');
        photographs.forEach(photo => {
            photo.hidden = photo !== photograph;
        });
        controls.forEach(control => {
            control.setAttribute('aria-pressed', String(control === button));
        });
        const stops = this.querySelectorAll('[data-route-stop]');
        stops.forEach(stop => {
            stop.dataset.current = String(stop.dataset.routeStop === stage);
        });
        scene?.style.setProperty('--truck-position', button.dataset.position ?? '8.333%');
        const title = this.querySelector('[data-insight-title]');
        if (title)
            title.textContent = button.dataset.title ?? '';
        const insight = this.querySelector('[data-insight-copy]');
        if (insight)
            insight.textContent = button.dataset.insight ?? '';
    };
}
if (!customElements.get('dwell-time-journey')) {
    customElements.define('dwell-time-journey', DwellTimeJourney);
}
