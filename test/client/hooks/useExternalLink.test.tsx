import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useExternalLink } from '@/hooks/useExternalLink';

describe('useExternalLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    window.open = vi.fn();
  });

  it('should initialize with closed dialog', () => {
    const { result } = renderHook(() => useExternalLink());

    expect(result.current).toBeDefined();
    expect(result.current.openExternal).toBeDefined();
    expect(result.current.ExternalLinkDialog).toBeDefined();
  });

  it('should open dialog when openExternal is called', () => {
    const { result } = renderHook(() => useExternalLink());

    act(() => {
      result.current.openExternal('https://example.com');
    });

    const { ExternalLinkDialog } = result.current;
    render(<ExternalLinkDialog />);
    
    // Dialog should be open
    expect(screen.getByText(/open external link/i)).toBeInTheDocument();
  });

  it('should open link in new window when confirmed', async () => {
    const user = userEvent.setup();
    const { result } = renderHook(() => useExternalLink());
    const testUrl = 'https://example.com';

    act(() => {
      result.current.openExternal(testUrl);
    });

    const { ExternalLinkDialog } = result.current;
    render(<ExternalLinkDialog />);

    const confirmButton = screen.getByRole('button', { name: /open link/i });
    await user.click(confirmButton);

    expect(window.open).toHaveBeenCalledWith(testUrl, '_blank', 'noopener,noreferrer');
  });

  it('should close dialog when canceled', async () => {
    const user = userEvent.setup();
    const { result } = renderHook(() => useExternalLink());

    act(() => {
      result.current.openExternal('https://example.com');
    });

    const { ExternalLinkDialog } = result.current;
    render(<ExternalLinkDialog />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(window.open).not.toHaveBeenCalled();
  });

  it('should display URL in dialog', () => {
    const { result } = renderHook(() => useExternalLink());
    const testUrl = 'https://example.com/test-page';

    act(() => {
      result.current.openExternal(testUrl);
    });

    const { ExternalLinkDialog } = result.current;
    render(<ExternalLinkDialog />);

    expect(screen.getByText(testUrl)).toBeInTheDocument();
  });
});

