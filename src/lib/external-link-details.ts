export function externalSourceContext(href: string): string {
  try {
    const hostname = new URL(href).hostname;
    return hostname ? `Source: ${hostname}` : '';
  } catch {
    return '';
  }
}

/** Explicit source titles take precedence; ordinary links use a neutral hostname. */
export function resolveExternalDetails(trigger: HTMLElement): void {
  if (trigger.dataset.smartlinkType !== 'external' || trigger.dataset.smartlinkManual === 'true') return;

  let hostname = '';
  try {
    hostname = new URL(trigger.dataset.smartlinkHref || trigger.getAttribute('href') || '').hostname;
  } catch {
    // A missing or invalid URL has no reliable source metadata.
  }

  trigger.dataset.smartlinkTitle = hostname || 'External source';
  trigger.dataset.smartlinkSnippet = '';
}

/** Card templates use HTML strings; keep source labels as literal text. */
export function escapeLinkCardText(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}
