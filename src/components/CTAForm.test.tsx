import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import CTAForm from './CTAform';
import { installLeadCapture } from '../lib/lead-capture';

beforeEach(() => {
  installLeadCapture();
  vi.spyOn(window, 'open').mockReturnValue(null);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}')));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('benefit CTAForm with the shared capture handler', () => {
  it('keeps its existing labels and accepts a distinct CTA identity', () => {
    render(<CTAForm buttonText="Book Now" placeholder="Your email" ctaId="benefit-example" />);
    expect(screen.getByPlaceholderText('Your email').closest('form')).toHaveAttribute('data-cta-id', 'benefit-example');
    expect(screen.getByRole('button', { name: 'Book Now' })).toBeInTheDocument();
  });

  it('preserves immediate legacy booking while the rollout is off', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    render(<CTAForm />);
    fireEvent.change(screen.getByPlaceholderText(/enter your work email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /book a demo/i }));
    expect(window.open).toHaveBeenCalledOnce();
    expect(screen.getByRole('button')).not.toBeDisabled();
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ event: 'Demo Subscriber', ctaId: 'benefit-hero', ctaPlacement: 'hero' });
  });
});
