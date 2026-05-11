import type { BENTO_FORWARDED_METHODS } from './bento-config.mjs';

export type BentoMethod = (typeof BENTO_FORWARDED_METHODS)[number];

declare global {
  interface Window {
    bento?: Partial<Record<BentoMethod, (...args: unknown[]) => void>>;
  }
}

export function bentoCall(method: BentoMethod, ...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.bento?.[method]?.(...args);
}
