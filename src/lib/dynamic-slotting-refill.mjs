const codes = ['A', 'B', 'C', 'D'];
class DynamicSlottingRefill extends HTMLElement {
    picks = ['B', 'B', 'C', 'B'];
    slots = ['A', 'C'];
    events;
    observer;
    connectedCallback() {
        if (this.events)
            return;
        this.events = new AbortController();
        this.addEventListener('click', this.handleClick, { signal: this.events.signal });
        this.render();
        const controls = this.querySelectorAll('button');
        controls.forEach(control => { control.disabled = false; });
        const arrow = this.querySelector('.refill-arrow');
        if (arrow) {
            this.observer = new ResizeObserver(() => this.positionSource());
            this.observer.observe(arrow);
        }
    }
    disconnectedCallback() {
        this.events?.abort();
        this.events = undefined;
        this.observer?.disconnect();
        this.observer = undefined;
    }
    cycle(code) {
        return codes[(codes.indexOf(code) + 1) % codes.length];
    }
    choose() {
        // Prioritize SKU coverage, then use pick frequency to suggest an extra slot.
        // This example does not model stock levels or slot capacity.
        const unslotted = this.picks.filter(code => !this.slots.includes(code));
        const alreadySlotted = unslotted.length === 0;
        const candidates = [...new Set(alreadySlotted ? this.picks : unslotted)];
        const counts = candidates.map(code => this.picks.filter(pick => pick === code).length);
        const count = Math.max(0, ...counts);
        // Set insertion order makes equal counts favor the next product needed.
        const tied = candidates.filter((_, index) => counts[index] === count);
        return { code: tied[0], count, tied, alreadySlotted };
    }
    handleClick = (event) => {
        if (!(event.target instanceof Element))
            return;
        const control = event.target.closest('button[data-pick], button[data-slot]');
        if (!control || !this.contains(control) || control.disabled)
            return;
        const values = control.hasAttribute('data-pick') ? this.picks : this.slots;
        const index = Number(control.dataset.pick ?? control.dataset.slot);
        if (!Number.isInteger(index) || index < 0 || index >= values.length)
            return;
        values[index] = this.cycle(values[index]);
        this.render();
    };
    positionSource() {
        const arrow = this.querySelector('.refill-arrow');
        const source = this.querySelector('[data-source-position]');
        if (!arrow || !source)
            return;
        const width = Math.round(arrow.getBoundingClientRect().width);
        if (!width)
            return;
        arrow.setAttribute('viewBox', `0 0 ${width} 68`);
        source.setAttribute('transform', `translate(${width / 2} 0)`);
    }
    render() {
        const candidate = this.choose();
        const pickControls = this.querySelectorAll('[data-pick]');
        pickControls.forEach(control => {
            const index = Number(control.dataset.pick);
            const code = this.picks[index];
            control.textContent = code;
            control.dataset.recommended = String(code === candidate.code);
            control.setAttribute('aria-label', `Upcoming pick ${index + 1}: ${code}. Activate to change to ${this.cycle(code)}.`);
        });
        const slotControls = this.querySelectorAll('[data-slot]');
        slotControls.forEach(control => {
            const index = Number(control.dataset.slot);
            const code = this.slots[index];
            control.textContent = code;
            control.setAttribute('aria-label', `${index === 0 ? 'Left' : 'Right'} occupied slot: ${code}. Activate to change to ${this.cycle(code)}.`);
        });
        const mirrors = this.querySelectorAll('[data-mirror]');
        mirrors.forEach(slot => {
            slot.textContent = this.slots[Number(slot.dataset.mirror)];
        });
        const result = this.querySelector('[data-result]');
        if (result) {
            result.textContent = candidate.code;
            result.setAttribute('aria-label', `Suggested refill: ${candidate.code}`);
        }
        const arrow = this.querySelector('.refill-arrow');
        arrow?.setAttribute('aria-label', `${candidate.code} from reserve is a suggested refill for the opening`);
        const sourceCode = this.querySelector('[data-source-code]');
        if (sourceCode)
            sourceCode.textContent = candidate.code;
        const detail = this.querySelector('.refill-detail');
        if (detail) {
            const pickCount = `${candidate.count} ${candidate.count === 1 ? 'pick' : 'picks'}`;
            detail.textContent = candidate.tied.length > 1
                ? `${candidate.tied.join(' and ')} tie at ${pickCount}; ${candidate.code} comes first.${candidate.alreadySlotted ? ` Consider an extra ${candidate.code} slot.` : ''}`
                : candidate.alreadySlotted
                    ? `${candidate.code} has the most upcoming picks (${candidate.count}). Consider an extra ${candidate.code} slot.`
                    : `${candidate.code} has ${candidate.count} upcoming ${candidate.count === 1 ? 'pick' : 'picks'} and no slot.`;
        }
        this.positionSource();
    }
}
if (!customElements.get('dynamic-slotting-refill')) {
    customElements.define('dynamic-slotting-refill', DynamicSlottingRefill);
}
