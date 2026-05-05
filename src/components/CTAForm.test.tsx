import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CTAForm from './CTAform';

// Mock window.open
const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as any;

describe('CTAForm', () => {
  it('renders correctly with default props', () => {
    render(<CTAForm />);
    expect(screen.getByPlaceholderText(/enter your work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get free demo/i })).toBeInTheDocument();
  });

  it('renders correctly with custom props', () => {
    render(<CTAForm buttonText="Download Now" placeholder="Your email" />);
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download now/i })).toBeInTheDocument();
  });

  it('shows success state and opens link on submit', async () => {
    render(<CTAForm />);
    const emailInput = screen.getByPlaceholderText(/enter your work email/i);
    const submitButton = screen.getByRole('button', { name: /get free demo/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/opening calendar in a new tab/i)).toBeInTheDocument();
    expect(openSpy).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });
});
